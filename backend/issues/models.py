import os
import uuid
from django.db import models, transaction
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError


class IssueStatus(models.TextChoices):
    SUBMITTED = 'SUBMITTED', 'Submitted'
    UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
    ACCEPTED = 'ACCEPTED', 'Accepted'
    REJECTED = 'REJECTED', 'Rejected'
    ASSIGNED = 'ASSIGNED', 'Assigned'
    ON_THE_WAY = 'ON_THE_WAY', 'On The Way'
    ARRIVED = 'ARRIVED', 'Arrived'
    WORK_STARTED = 'WORK_STARTED', 'Work Started'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    DONE = 'DONE', 'Done'
    VERIFIED = 'VERIFIED', 'Verified'
    CLOSED = 'CLOSED', 'Closed'
    REOPENED = 'REOPENED', 'Reopened'


class IssuePriority(models.TextChoices):
    LOW = 'LOW', 'Low'
    MEDIUM = 'MEDIUM', 'Medium'
    HIGH = 'HIGH', 'High'
    CRITICAL = 'CRITICAL', 'Critical'


class IssueRejectionReason(models.TextChoices):
    INVALID_EVIDENCE = 'INVALID_EVIDENCE', 'Invalid or Unclear Evidence'
    DUPLICATE = 'DUPLICATE', 'Duplicate Submission'
    OUTSIDE_RESPONSIBILITY = 'OUTSIDE_RESPONSIBILITY', 'Outside Department Responsibility'
    INSUFFICIENT_INFORMATION = 'INSUFFICIENT_INFORMATION', 'Insufficient Information'
    NOT_FOUND_AFTER_INSPECTION = 'NOT_FOUND_AFTER_INSPECTION', 'Not Found After Site Inspection'
    OTHER = 'OTHER', 'Other Reason'


class IssueCategory(models.Model):
    name = models.CharField(max_length=120, unique=True)
    code = models.CharField(max_length=40, unique=True, db_index=True)
    description = models.TextField(blank=True)
    default_department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='categories'
    )
    default_priority = models.CharField(
        max_length=20,
        choices=IssuePriority.choices,
        default=IssuePriority.MEDIUM
    )
    icon_name = models.CharField(max_length=50, default='AlertCircle', help_text="Lucide icon name")
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Issue Category'
        verbose_name_plural = 'Issue Categories'

    def __str__(self):
        return f"{self.name} ({self.code})"


class IssueSequence(models.Model):
    year = models.IntegerField(unique=True)
    last_number = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Issue Sequence'
        verbose_name_plural = 'Issue Sequences'

    @classmethod
    def get_next_issue_id(cls, year=None):
        if year is None:
            year = timezone.now().year
        with transaction.atomic():
            seq, _ = cls.objects.select_for_update().get_or_create(year=year)
            seq.last_number += 1
            seq.save()
            return f"SC-{year}-{seq.last_number:05d}"


def issue_image_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower()
    return os.path.join('issues', 'images', f"{uuid.uuid4().hex}{ext}")


def issue_video_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower()
    return os.path.join('issues', 'videos', f"{uuid.uuid4().hex}{ext}")


def completion_image_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower()
    return os.path.join('issues', 'completion', f"{uuid.uuid4().hex}{ext}")


class Issue(models.Model):
    issue_id = models.CharField(max_length=30, unique=True, db_index=True, editable=False)
    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reported_issues'
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(
        IssueCategory,
        on_delete=models.SET_NULL,
        null=True,
        related_name='issues'
    )
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='issues'
    )
    priority = models.CharField(
        max_length=20,
        choices=IssuePriority.choices,
        default=IssuePriority.MEDIUM,
        db_index=True
    )
    status = models.CharField(
        max_length=30,
        choices=IssueStatus.choices,
        default=IssueStatus.SUBMITTED,
        db_index=True
    )
    assigned_worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_work_orders'
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_by_orders'
    )
    rejection_reason = models.CharField(max_length=100, blank=True)
    rejection_notes = models.TextField(blank=True)
    affected_citizens_count = models.PositiveIntegerField(default=1, db_index=True)
    sla_deadline = models.DateTimeField(null=True, blank=True, db_index=True)
    is_sla_breached = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Issue'
        verbose_name_plural = 'Issues'

    def __str__(self):
        return f"{self.issue_id}: {self.title} [{self.get_status_display()}]"

    def save(self, *args, **kwargs):
        if not self.issue_id:
            self.issue_id = IssueSequence.get_next_issue_id()
        super().save(*args, **kwargs)


class IssueLocation(models.Model):
    issue = models.OneToOneField(Issue, on_delete=models.CASCADE, related_name='location')
    latitude = models.DecimalField(max_digits=10, decimal_places=7, db_index=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, db_index=True)
    address_text = models.CharField(max_length=350)
    landmark = models.CharField(max_length=200, blank=True)
    ward = models.CharField(max_length=100, blank=True, db_index=True)
    captured_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = 'Issue Location'
        verbose_name_plural = 'Issue Locations'

    def __str__(self):
        return f"{self.issue.issue_id} @ ({self.latitude}, {self.longitude})"


class IssueImage(models.Model):
    CAPTURE_SOURCES = (
        ('CAMERA', 'Live Camera Capture'),
        ('GALLERY', 'Gallery Upload'),
    )
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to=issue_image_upload_path)
    caption = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    capture_source = models.CharField(max_length=20, choices=CAPTURE_SOURCES, default='CAMERA')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_primary', 'uploaded_at']
        verbose_name = 'Issue Image'
        verbose_name_plural = 'Issue Images'

    def __str__(self):
        return f"Image for {self.issue.issue_id} ({self.capture_source})"


class IssueVideo(models.Model):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='videos')
    video = models.FileField(upload_to=issue_video_upload_path)
    duration_seconds = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Issue Video'
        verbose_name_plural = 'Issue Videos'


class IssueStatusHistory(models.Model):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='status_history')
    from_status = models.CharField(max_length=30, choices=IssueStatus.choices)
    to_status = models.CharField(max_length=30, choices=IssueStatus.choices)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='status_transitions'
    )
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Issue Status History'
        verbose_name_plural = 'Issue Status Histories'

    def __str__(self):
        return f"{self.issue.issue_id}: {self.from_status} -> {self.to_status} by {self.changed_by}"


class IssueAssignment(models.Model):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='assignments')
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='task_assignments'
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_assignments'
    )
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-assigned_at']
        verbose_name = 'Issue Assignment'
        verbose_name_plural = 'Issue Assignments'


class CompletionEvidence(models.Model):
    issue = models.OneToOneField(Issue, on_delete=models.CASCADE, related_name='completion_evidence')
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submitted_completions'
    )
    after_image = models.ImageField(upload_to=completion_image_upload_path)
    before_image = models.ImageField(upload_to=completion_image_upload_path, blank=True, null=True)
    description = models.TextField(help_text="Detailed description of repair work performed")
    materials_used = models.TextField(blank=True, help_text="Equipment, asphalt, cables, or replacement parts used")
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    completed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = 'Completion Evidence'
        verbose_name_plural = 'Completion Evidences'

    def __str__(self):
        return f"Completion for {self.issue.issue_id} by {self.worker.username}"


class CitizenFeedback(models.Model):
    issue = models.OneToOneField(Issue, on_delete=models.CASCADE, related_name='feedback')
    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submitted_feedbacks'
    )
    is_satisfied = models.BooleanField(default=True)
    rating = models.PositiveSmallIntegerField(default=5, help_text="1 to 5 star rating")
    comment = models.TextField(blank=True)
    is_reopened = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Citizen Feedback'
        verbose_name_plural = 'Citizen Feedbacks'


class SLAConfiguration(models.Model):
    priority = models.CharField(max_length=20, choices=IssuePriority.choices, unique=True)
    response_time_hours = models.PositiveIntegerField(help_text="Target hours to accept and review issue")
    resolution_time_hours = models.PositiveIntegerField(help_text="Target hours to fully resolve issue")
    warning_threshold_hours = models.PositiveIntegerField(default=2, help_text="Hours before deadline to trigger amber warning")

    class Meta:
        ordering = ['resolution_time_hours']
        verbose_name = 'SLA Configuration'
        verbose_name_plural = 'SLA Configurations'

    def __str__(self):
        return f"SLA {self.get_priority_display()}: {self.resolution_time_hours}h resolution"


class IssueUpvote(models.Model):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='upvotes')
    citizen = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='issue_upvotes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('issue', 'citizen')
        verbose_name = 'Issue Upvote'
        verbose_name_plural = 'Issue Upvotes'

    def __str__(self):
        return f"{self.citizen.username} upvoted {self.issue.issue_id}"


class DuplicateMatch(models.Model):
    primary_issue = models.ForeignKey(
        Issue,
        on_delete=models.CASCADE,
        related_name='duplicate_matches'
    )
    duplicate_issue = models.ForeignKey(
        Issue,
        on_delete=models.CASCADE,
        related_name='merged_into_matches'
    )
    similarity_score = models.FloatField(help_text="Similarity confidence (0.0 to 1.0)")
    distance_meters = models.FloatField(help_text="Calculated distance between pins in meters")
    match_reasons = models.JSONField(default=list, blank=True)
    detected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Duplicate Match'
        verbose_name_plural = 'Duplicate Matches'

    def __str__(self):
        return f"{self.duplicate_issue.issue_id} -> {self.primary_issue.issue_id} ({int(self.similarity_score * 100)}%)"

