from django.db import models


class DepartmentPerformanceDaily(models.Model):
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.CASCADE,
        related_name='daily_analytics'
    )
    date = models.DateField(db_index=True)
    total_received = models.PositiveIntegerField(default=0)
    total_resolved = models.PositiveIntegerField(default=0)
    total_rejected = models.PositiveIntegerField(default=0)
    sla_breached_count = models.PositiveIntegerField(default=0)
    avg_resolution_hours = models.FloatField(default=0.0)

    class Meta:
        ordering = ['-date']
        verbose_name = 'Department Performance Daily'
        verbose_name_plural = 'Department Performance Daily Analytics'
        unique_together = ('department', 'date')

    def __str__(self):
        return f"{self.department.name} - {self.date}"
