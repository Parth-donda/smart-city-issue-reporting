from django.db import models
from django.conf import settings


class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=50,
        default='STATUS_UPDATE',
        help_text="STATUS_UPDATE, WORKER_ASSIGNED, SLA_WARNING, VERIFICATION_REQUEST, CLOSURE"
    )
    link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self):
        status = "Read" if self.is_read else "Unread"
        return f"[{status}] {self.user.username}: {self.title}"
