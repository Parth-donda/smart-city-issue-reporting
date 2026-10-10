from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    issue = models.ForeignKey(
        'issues.Issue',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    role = models.CharField(max_length=40, blank=True)
    action = models.CharField(max_length=100, db_index=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'

    def __str__(self):
        actor_name = self.actor.username if self.actor else "System"
        issue_ref = f"[{self.issue.issue_id}]" if self.issue else ""
        return f"{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')} {issue_ref} {actor_name} ({self.role}): {self.action}"
