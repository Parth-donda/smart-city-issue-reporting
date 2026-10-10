import os
import math
import hashlib
from datetime import datetime
from PIL import Image, ExifTags
from django.utils import timezone
from evidence.models import EvidenceVerification, ConfidenceBand


class EvidenceVerificationService:
    """
    Forensic analysis service for uploaded civic grievance evidence.
    Evaluates EXIF metadata, GPS coordinate proximity, timestamp consistency,
    and perceptual duplicate hashing.

    STRICT POLICY:
    - AI / Automated scores are operational indicators, NOT proof of fraud.
    - Wording never uses 'REAL' or 'FAKE'.
    - Missing EXIF reduces score mildly but never blocks submission.
    """

    @staticmethod
    def calculate_distance_km(lat1, lon1, lat2, lon2):
        """Haversine formula to compute great-circle distance between two points in km."""
        if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
            return None
        r = 6371.0  # Earth radius in kilometers
        phi1 = math.radians(float(lat1))
        phi2 = math.radians(float(lat2))
        delta_phi = math.radians(float(lat2) - float(lat1))
        delta_lambda = math.radians(float(lon2) - float(lon1))

        a = math.sin(delta_phi / 2.0) ** 2 + \
            math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return round(r * c, 3)

    @staticmethod
    def _convert_dms_to_decimal(dms, ref):
        """Convert degrees, minutes, seconds tuple to decimal degrees."""
        if not dms or len(dms) < 3:
            return None
        try:
            d = float(dms[0])
            m = float(dms[1])
            s = float(dms[2])
            decimal = d + (m / 60.0) + (s / 3600.0)
            if ref in ['S', 'W']:
                decimal = -decimal
            return round(decimal, 7)
        except Exception:
            return None

    @staticmethod
    def _compute_perceptual_hash(image_path):
        """Compute 64-bit difference hash (dHash) for perceptual duplicate detection."""
        try:
            with Image.open(image_path) as img:
                img = img.convert('L').resize((9, 8), Image.Resampling.LANCZOS)
                pixels = list(img.getdata())
                diff = []
                for row in range(8):
                    for col in range(8):
                        pixel_left = pixels[row * 9 + col]
                        pixel_right = pixels[row * 9 + col + 1]
                        diff.append(1 if pixel_left > pixel_right else 0)
                decimal_val = 0
                hex_str = []
                for index, bit in enumerate(diff):
                    if bit:
                        decimal_val += 2 ** (index % 4)
                    if index % 4 == 3:
                        hex_str.append(hex(decimal_val)[2:])
                        decimal_val = 0
                return ''.join(hex_str)
        except Exception:
            return ''

    @classmethod
    def verify_issue_evidence(cls, issue):
        """Analyzes all images attached to an issue and updates EvidenceVerification record."""
        images = list(issue.images.all())
        if not images:
            # Baseline entry if no images uploaded
            return EvidenceVerification.objects.update_or_create(
                issue=issue,
                defaults={
                    'overall_confidence_score': 60,
                    'confidence_band': ConfidenceBand.MANUAL_REVIEW,
                    'location_consistency': 'NO_MEDIA_ATTACHED',
                    'timestamp_consistency': 'NO_MEDIA_ATTACHED',
                    'exif_metadata': {'status': 'No photographic evidence uploaded with report.'},
                    'manipulation_indicators': {'flags': ['Missing image attachment']},
                }
            )[0]

        primary_img = images[0]
        file_path = primary_img.image.path if hasattr(primary_img.image, 'path') and os.path.exists(primary_img.image.path) else None

        sha256_hash = ''
        phash = ''
        exif_data = {}
        exif_lat = None
        exif_lon = None
        exif_time = None
        software_detected = None

        if file_path:
            # Compute SHA-256
            hasher = hashlib.sha256()
            with open(file_path, 'rb') as f:
                for chunk in iter(lambda: f.read(65536), b''):
                    hasher.update(chunk)
            sha256_hash = hasher.hexdigest()

            # Compute dHash
            phash = cls._compute_perceptual_hash(file_path)

            # Extract EXIF
            try:
                with Image.open(file_path) as img:
                    raw_exif = img._getexif()
                    if raw_exif:
                        for tag_id, value in raw_exif.items():
                            tag_name = ExifTags.TAGS.get(tag_id, tag_id)
                            if tag_name == 'GPSInfo':
                                gps_data = {}
                                for t in value:
                                    sub_tag = ExifTags.GPSTAGS.get(t, t)
                                    gps_data[sub_tag] = value[t]
                                if 'GPSLatitude' in gps_data and 'GPSLatitudeRef' in gps_data:
                                    exif_lat = cls._convert_dms_to_decimal(gps_data['GPSLatitude'], gps_data['GPSLatitudeRef'])
                                if 'GPSLongitude' in gps_data and 'GPSLongitudeRef' in gps_data:
                                    exif_lon = cls._convert_dms_to_decimal(gps_data['GPSLongitude'], gps_data['GPSLongitudeRef'])
                            elif tag_name in ['DateTimeOriginal', 'DateTimeDigitized', 'DateTime']:
                                exif_time = str(value)
                                exif_data['capture_datetime'] = exif_time
                            elif tag_name == 'Make':
                                exif_data['device_make'] = str(value)
                            elif tag_name == 'Model':
                                exif_data['device_model'] = str(value)
                            elif tag_name == 'Software':
                                software_detected = str(value)
                                exif_data['software'] = software_detected
            except Exception:
                pass

        # 1. Location Consistency Calculation
        location_status = 'CONSISTENT'
        location_remarks = 'Location metadata matches reported site.'
        loc_score = 30

        report_lat = getattr(issue.location, 'latitude', None) if hasattr(issue, 'location') else None
        report_lng = getattr(issue.location, 'longitude', None) if hasattr(issue, 'location') else None

        if exif_lat is not None and exif_lon is not None and report_lat is not None and report_lng is not None:
            dist_km = cls.calculate_distance_km(report_lat, report_lng, exif_lat, exif_lon)
            exif_data['exif_coordinates'] = {'latitude': exif_lat, 'longitude': exif_lon}
            exif_data['calculated_distance_km'] = dist_km

            if dist_km <= 1.0:
                location_status = 'CONSISTENT'
                location_remarks = f'EXIF GPS location is within {int(dist_km * 1000)}m of complaint pin.'
                loc_score = 30
            elif dist_km <= 3.5:
                location_status = 'PROXIMATE_WARNING'
                location_remarks = f'EXIF GPS coordinate is {dist_km} km away from complaint pin.'
                loc_score = 18
            else:
                location_status = 'POSSIBLE_MISMATCH'
                location_remarks = f'EXIF GPS indicates image was captured {dist_km} km away from pin.'
                loc_score = 8
        else:
            location_status = 'GPS_NOT_PRESENT'
            location_remarks = 'Device EXIF GPS was stripped or unavailable during upload.'
            loc_score = 22

        # 2. Timestamp Consistency Calculation
        time_status = 'CONSISTENT'
        time_remarks = 'Capture timestamp consistent with report time.'
        time_score = 25

        if exif_time:
            try:
                parsed_time = datetime.strptime(exif_time.strip(), '%Y:%m:%d %H:%M:%S')
                age_days = (timezone.now().replace(tzinfo=None) - parsed_time).total_seconds() / 86400.0
                if age_days < 2.0:
                    time_status = 'CONSISTENT'
                    time_remarks = 'Photo was captured recently (within 48 hours).'
                    time_score = 25
                elif age_days < 14.0:
                    time_status = 'MODERATE_AGE'
                    time_remarks = f'Photo was taken {int(age_days)} days prior to report.'
                    time_score = 18
                else:
                    time_status = 'ARCHIVED_IMAGE'
                    time_remarks = f'Photo timestamp is {int(age_days)} days old.'
                    time_score = 10
            except Exception:
                time_status = 'TIMESTAMP_UNPARSED'
                time_score = 20
        else:
            time_status = 'NO_TIMESTAMP'
            time_remarks = 'Standard web upload (EXIF timestamp absent).'
            time_score = 20

        # 3. Duplicate Image Detection
        dup_status = 'UNIQUE'
        dup_remarks = 'Perceptual hash unique — no duplicate image detected.'
        dup_score = 25

        if phash:
            existing = EvidenceVerification.objects.filter(perceptual_hash=phash).exclude(issue=issue).first()
            if existing:
                dup_status = 'POSSIBLE_DUPLICATE'
                dup_remarks = f'Identical perceptual hash matches previous report {existing.issue.issue_id}.'
                dup_score = 5

        # 4. Capture Source & Integrity
        source_score = 20 if primary_img.capture_source == 'CAMERA' else 15

        # Calculate Overall Score (0-100)
        total_score = min(100, max(25, loc_score + time_score + dup_score + source_score))

        if total_score >= 85:
            confidence_band = ConfidenceBand.HIGH
        elif total_score >= 65:
            confidence_band = ConfidenceBand.MEDIUM
        else:
            confidence_band = ConfidenceBand.MANUAL_REVIEW

        indicators = {
            'location_analysis': {'status': location_status, 'remarks': location_remarks},
            'timestamp_analysis': {'status': time_status, 'remarks': time_remarks},
            'duplicate_analysis': {'status': dup_status, 'remarks': dup_remarks},
            'capture_source': primary_img.capture_source,
            'software_used': software_detected or 'Native Camera / OS',
        }

        ver_obj, _ = EvidenceVerification.objects.update_or_create(
            issue=issue,
            defaults={
                'overall_confidence_score': total_score,
                'confidence_band': confidence_band,
                'exif_metadata': exif_data,
                'location_consistency': location_status,
                'timestamp_consistency': time_status,
                'manipulation_indicators': indicators,
                'file_hash_sha256': sha256_hash,
                'perceptual_hash': phash,
                'verified_at': timezone.now()
            }
        )
        return ver_obj
