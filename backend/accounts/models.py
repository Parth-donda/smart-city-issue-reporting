from django.db import models
from django.contrib.auth.models import AbstractUser


class Role(models.TextChoices):
    CITIZEN = 'CITIZEN', 'Citizen'
    DEPARTMENT_OFFICER = 'DEPARTMENT_OFFICER', 'Department Officer'
    WORKER = 'WORKER', 'Field Worker'
    SUPERVISOR = 'SUPERVISOR', 'Department Supervisor'
    MUNICIPAL_ADMIN = 'MUNICIPAL_ADMIN', 'Municipal Admin'
    SYSTEM_ADMIN = 'SYSTEM_ADMIN', 'System Admin'


class User(AbstractUser):
    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.CITIZEN,
        db_index=True
    )
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='members',
        help_text="Assigned department for department officers, supervisors, and administrative staff."
    )
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_citizen(self):
        return self.role == Role.CITIZEN

    @property
    def is_officer(self):
        return self.role == Role.DEPARTMENT_OFFICER

    @property
    def is_worker(self):
        return self.role == Role.WORKER

    @property
    def is_supervisor(self):
        return self.role == Role.SUPERVISOR

    @property
    def is_municipal_admin(self):
        return self.role == Role.MUNICIPAL_ADMIN or self.is_superuser

    @property
    def is_system_admin(self):
        return self.role == Role.SYSTEM_ADMIN or self.is_superuser


class WorkerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='worker_profile')
    department = models.ForeignKey('departments.Department', on_delete=models.CASCADE, related_name='workers')
    phone = models.CharField(max_length=20, blank=True)
    skills = models.TextField(blank=True, help_text="Specializations: e.g., Pothole compaction, High-voltage cabling, Drainage desilting")
    is_available = models.BooleanField(default=True, db_index=True)
    active_task_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['active_task_count', 'created_at']
        verbose_name = 'Worker Profile'
        verbose_name_plural = 'Worker Profiles'

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - {self.department.name} ({self.active_task_count} tasks)"
