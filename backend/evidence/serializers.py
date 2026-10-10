from rest_framework import serializers
from .models import EvidenceVerification


class EvidenceVerificationSerializer(serializers.ModelSerializer):
    confidence_band_display = serializers.CharField(source='get_confidence_band_display', read_only=True)

    class Meta:
        model = EvidenceVerification
        fields = [
            'id',
            'overall_confidence_score',
            'confidence_band',
            'confidence_band_display',
            'exif_metadata',
            'location_consistency',
            'timestamp_consistency',
            'manipulation_indicators',
            'file_hash_sha256',
            'perceptual_hash',
            'verified_at',
        ]
        read_only_fields = ['id', 'verified_at']
