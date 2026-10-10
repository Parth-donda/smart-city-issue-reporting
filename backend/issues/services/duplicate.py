import math
from django.utils import timezone
from datetime import timedelta
from issues.models import Issue, IssueStatus, DuplicateMatch
from evidence.services.verification import EvidenceVerificationService


class DuplicateDetectionService:
    """
    Detects potential duplicate civic issues within a geographical proximity radius
    and category/keyword similarity window.
    """

    @classmethod
    def find_nearby_duplicates(cls, latitude, longitude, category_id=None, radius_meters=500, time_window_days=30):
        """
        Finds active or recent civic issues located within `radius_meters` of given coordinate.
        """
        if latitude is None or longitude is None:
            return []

        try:
            lat = float(latitude)
            lng = float(longitude)
        except (ValueError, TypeError):
            return []

        cutoff_date = timezone.now() - timedelta(days=time_window_days)
        active_statuses = [
            IssueStatus.SUBMITTED,
            IssueStatus.UNDER_REVIEW,
            IssueStatus.ACCEPTED,
            IssueStatus.ASSIGNED,
            IssueStatus.ON_THE_WAY,
            IssueStatus.ARRIVED,
            IssueStatus.WORK_STARTED,
            IssueStatus.IN_PROGRESS,
            IssueStatus.REOPENED,
        ]

        candidates = Issue.objects.filter(
            status__in=active_statuses,
            created_at__gte=cutoff_date,
            location__isnull=False
        ).select_related('category', 'location', 'department')

        if category_id:
            candidates = candidates.filter(category_id=category_id)

        results = []
        for issue in candidates:
            cand_lat = float(issue.location.latitude)
            cand_lng = float(issue.location.longitude)
            dist_km = EvidenceVerificationService.calculate_distance_km(lat, lng, cand_lat, cand_lng)
            if dist_km is not None:
                dist_m = dist_km * 1000.0
                if dist_m <= radius_meters:
                    similarity = max(0.5, min(1.0, 1.0 - (dist_m / (radius_meters * 1.5))))
                    results.append({
                        'issue_id': issue.issue_id,
                        'id': issue.id,
                        'title': issue.title,
                        'category_name': issue.category.name if issue.category else 'General',
                        'status': issue.status,
                        'status_display': issue.get_status_display(),
                        'priority': issue.priority,
                        'address_text': issue.location.address_text,
                        'distance_meters': round(dist_m, 1),
                        'similarity_score': round(similarity, 2),
                        'affected_citizens_count': issue.affected_citizens_count,
                        'created_at': issue.created_at,
                    })

        results.sort(key=lambda x: x['distance_meters'])
        return results[:5]
