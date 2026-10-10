from django.db import models


class ConfidenceBand(models.TextChoices):
    HIGH = 'HIGH', 'High Confidence'
    MEDIUM = 'MEDIUM', 'Medium Confidence'
    MANUAL_REVIEW = 'MANUAL_REVIEW', 'Manual Review Recommended'


class EvidenceVerification(models.Model):
    issue = models.OneToOneField(
        'issues.Issue',
        on_delete=models.CASCADE,
        related_name='evidence_verification'
    )
    overall_confidence_score = models.PositiveSmallIntegerField(
        default=100,
        help_text="Evidence confidence score 0-100 (operational indicator, not absolute proof)"
    )
    confidence_band = models.CharField(
        max_length=20,
        choices=ConfidenceBand.choices,
        default=ConfidenceBand.HIGH,
        db_index=True
    )
    exif_metadata = models.JSONField(default=dict, blank=True)
    location_consistency = models.CharField(
        max_length=30,
        default='CONSISTENT',
        help_text="Location appears consistent / Possible location mismatch"
    )
    timestamp_consistency = models.CharField(
        max_length=30,
        default='CONSISTENT',
        help_text="Timestamp consistent / Possible timestamp discrepancy"
    )
    manipulation_indicators = models.JSONField(
        default=dict,
        blank=True,
        help_text="Compression, noise level, or ELA indicators"
    )
    file_hash_sha256 = models.CharField(max_length=64, blank=True, db_index=True)
    perceptual_hash = models.CharField(max_length=64, blank=True, db_index=True)
    verified_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Evidence Verification'
        verbose_name_plural = 'Evidence Verifications'

    def __str__(self):
        return f"Evidence for {self.issue.issue_id}: Score {self.overall_confidence_score}% [{self.confidence_band}]"
