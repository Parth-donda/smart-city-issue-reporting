from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError, PermissionDenied
from issues.models import (
    Issue, IssueStatus, IssuePriority, IssueRejectionReason,
    IssueStatusHistory, IssueAssignment, SLAConfiguration
)
from audit.models import AuditLog
from notifications.models import Notification
from accounts.models import Role, User


class IllegalTransitionError(ValidationError):
    """Raised when an illegal status jump is attempted."""
    pass


class LifecycleService:
    """
    Centralized, authoritative state machine engine for SmartCivic issues.
    Enforces strict RBAC and lifecycle invariants.
    """

    # Global allowed forward/backward transition graph
    ALLOWED_TRANSITIONS = {
        IssueStatus.SUBMITTED: [IssueStatus.UNDER_REVIEW, IssueStatus.ACCEPTED, IssueStatus.REJECTED],
        IssueStatus.UNDER_REVIEW: [IssueStatus.ACCEPTED, IssueStatus.REJECTED, IssueStatus.SUBMITTED],
        IssueStatus.ACCEPTED: [IssueStatus.ASSIGNED, IssueStatus.UNDER_REVIEW, IssueStatus.REJECTED],
        IssueStatus.REJECTED: [IssueStatus.UNDER_REVIEW, IssueStatus.SUBMITTED], # Can be reopened or re-routed
        IssueStatus.ASSIGNED: [IssueStatus.ON_THE_WAY, IssueStatus.ASSIGNED, IssueStatus.ACCEPTED, IssueStatus.WORK_STARTED],
        IssueStatus.ON_THE_WAY: [IssueStatus.ARRIVED, IssueStatus.ASSIGNED],
        IssueStatus.ARRIVED: [IssueStatus.WORK_STARTED, IssueStatus.IN_PROGRESS],
        IssueStatus.WORK_STARTED: [IssueStatus.IN_PROGRESS, IssueStatus.DONE],
        IssueStatus.IN_PROGRESS: [IssueStatus.DONE, IssueStatus.WORK_STARTED],
        IssueStatus.DONE: [IssueStatus.VERIFIED, IssueStatus.IN_PROGRESS, IssueStatus.REOPENED],
        IssueStatus.VERIFIED: [IssueStatus.CLOSED, IssueStatus.REOPENED],
        IssueStatus.CLOSED: [IssueStatus.REOPENED],
        IssueStatus.REOPENED: [IssueStatus.UNDER_REVIEW, IssueStatus.ACCEPTED, IssueStatus.ASSIGNED],
    }

    # Role specific authorized transitions
    ROLE_PERMITTED_TRANSITIONS = {
        Role.CITIZEN: {
            # Citizen can confirm resolution (CLOSED) or reopen (REOPENED)
            IssueStatus.DONE: [IssueStatus.CLOSED, IssueStatus.REOPENED],
            IssueStatus.VERIFIED: [IssueStatus.CLOSED, IssueStatus.REOPENED],
            IssueStatus.CLOSED: [IssueStatus.REOPENED],
        },
        Role.DEPARTMENT_OFFICER: {
            IssueStatus.SUBMITTED: [IssueStatus.UNDER_REVIEW, IssueStatus.ACCEPTED, IssueStatus.REJECTED],
            IssueStatus.UNDER_REVIEW: [IssueStatus.ACCEPTED, IssueStatus.REJECTED],
            IssueStatus.ACCEPTED: [IssueStatus.ASSIGNED, IssueStatus.REJECTED, IssueStatus.UNDER_REVIEW],
            IssueStatus.ASSIGNED: [IssueStatus.ASSIGNED, IssueStatus.ACCEPTED], # Reassign or unassign
            IssueStatus.REOPENED: [IssueStatus.UNDER_REVIEW, IssueStatus.ACCEPTED, IssueStatus.ASSIGNED],
        },
        Role.SUPERVISOR: {
            IssueStatus.SUBMITTED: [IssueStatus.UNDER_REVIEW, IssueStatus.ACCEPTED, IssueStatus.REJECTED],
            IssueStatus.UNDER_REVIEW: [IssueStatus.ACCEPTED, IssueStatus.REJECTED],
            IssueStatus.ACCEPTED: [IssueStatus.ASSIGNED, IssueStatus.REJECTED],
            IssueStatus.ASSIGNED: [IssueStatus.ASSIGNED, IssueStatus.ACCEPTED],
            IssueStatus.DONE: [IssueStatus.VERIFIED, IssueStatus.IN_PROGRESS],
            IssueStatus.VERIFIED: [IssueStatus.CLOSED],
            IssueStatus.REOPENED: [IssueStatus.UNDER_REVIEW, IssueStatus.ACCEPTED, IssueStatus.ASSIGNED],
        },
        Role.WORKER: {
            IssueStatus.ASSIGNED: [IssueStatus.ON_THE_WAY, IssueStatus.ARRIVED, IssueStatus.WORK_STARTED],
            IssueStatus.ON_THE_WAY: [IssueStatus.ARRIVED],
            IssueStatus.ARRIVED: [IssueStatus.WORK_STARTED, IssueStatus.IN_PROGRESS],
            IssueStatus.WORK_STARTED: [IssueStatus.IN_PROGRESS, IssueStatus.DONE],
            IssueStatus.IN_PROGRESS: [IssueStatus.DONE],
        },
        Role.MUNICIPAL_ADMIN: ALLOWED_TRANSITIONS,
        Role.SYSTEM_ADMIN: ALLOWED_TRANSITIONS,
    }

    @classmethod
    def calculate_sla_deadline(cls, priority: str, base_time=None):
        """Calculates SLA deadline from SLAConfiguration table."""
        if base_time is None:
            base_time = timezone.now()
        
        sla_config = SLAConfiguration.objects.filter(priority=priority).first()
        if sla_config:
            return base_time + timezone.timedelta(hours=sla_config.resolution_time_hours)
        
        # Fallbacks if table not configured
        fallback_hours = {
            IssuePriority.CRITICAL: 12,
            IssuePriority.HIGH: 24,
            IssuePriority.MEDIUM: 72,
            IssuePriority.LOW: 168,
        }
        return base_time + timezone.timedelta(hours=fallback_hours.get(priority, 72))

    @classmethod
    def check_transition_allowed(cls, current_status: str, target_status: str, user: User, is_reassignment=False) -> bool:
        """Validates if transition is legal per graph and per user role."""
        if user.is_superuser or user.role in [Role.MUNICIPAL_ADMIN, Role.SYSTEM_ADMIN]:
            return True

        if is_reassignment and current_status == IssueStatus.ASSIGNED and target_status == IssueStatus.ASSIGNED:
            return user.role in [Role.DEPARTMENT_OFFICER, Role.SUPERVISOR, Role.MUNICIPAL_ADMIN, Role.SYSTEM_ADMIN]

        # Check global graph
        allowed_targets = cls.ALLOWED_TRANSITIONS.get(current_status, [])
        if target_status not in allowed_targets and not (current_status == target_status and is_reassignment):
            return False

        # Check role permission
        role_map = cls.ROLE_PERMITTED_TRANSITIONS.get(user.role, {})
        user_allowed_targets = role_map.get(current_status, [])
        return target_status in user_allowed_targets

    @classmethod
    def transition(
        cls,
        issue: Issue,
        to_status: str,
        user: User,
        remarks: str = "",
        rejection_reason: str = "",
        rejection_notes: str = "",
        assigned_worker: User = None,
        new_priority: str = None,
        target_department=None,
        ip_address: str = None
    ) -> Issue:
        """
        Executes a status transition atomically with complete audit logs and notifications.
        """
        from_status = issue.status
        is_reassign = (from_status == IssueStatus.ASSIGNED and to_status == IssueStatus.ASSIGNED and assigned_worker is not None)

        if not is_reassign and from_status == to_status:
            # No status change requested, just return
            return issue

        # 1. Permission & State Validation
        if not cls.check_transition_allowed(from_status, to_status, user, is_reassignment=is_reassign):
            raise IllegalTransitionError(
                f"Transition from '{from_status}' to '{to_status}' is not permitted for role '{user.get_role_display()}'."
            )

        # Department boundary enforcement for officers / supervisors / workers
        if user.role in [Role.DEPARTMENT_OFFICER, Role.SUPERVISOR]:
            if user.department and issue.department and user.department != issue.department:
                raise PermissionDenied("You can only manage issues assigned to your own department.")
        
        if user.role == Role.WORKER:
            if issue.assigned_worker != user:
                raise PermissionDenied("You can only update tasks assigned directly to you.")

        # Rejection validation
        if to_status == IssueStatus.REJECTED:
            if not rejection_reason:
                raise ValidationError({"rejection_reason": "A valid rejection reason is mandatory when rejecting an issue."})
            valid_reasons = [choice[0] for choice in IssueRejectionReason.choices]
            if rejection_reason not in valid_reasons:
                raise ValidationError({"rejection_reason": f"Invalid reason '{rejection_reason}'. Must be one of {valid_reasons}."})

        # Worker Assignment validation
        if to_status == IssueStatus.ASSIGNED:
            if not assigned_worker:
                raise ValidationError({"assigned_worker_id": "An assigned worker is required for ASSIGNED status."})
            if assigned_worker.role != Role.WORKER:
                raise ValidationError({"assigned_worker_id": "Assigned user must have the WORKER role."})
            if issue.department and hasattr(assigned_worker, 'worker_profile'):
                if assigned_worker.worker_profile.department != issue.department:
                    raise ValidationError({"assigned_worker_id": "Worker does not belong to the responsible department."})

        with transaction.atomic():
            # 2. Update issue fields
            issue.status = to_status

            if new_priority and new_priority in IssuePriority.values:
                issue.priority = new_priority
                issue.sla_deadline = cls.calculate_sla_deadline(new_priority, base_time=issue.created_at)

            if to_status == IssueStatus.ACCEPTED and not issue.sla_deadline:
                issue.sla_deadline = cls.calculate_sla_deadline(issue.priority)

            if to_status == IssueStatus.REJECTED:
                issue.rejection_reason = rejection_reason
                issue.rejection_notes = rejection_notes or remarks

                # Handle department re-routing if target department specified
                if target_department:
                    prev_dept_name = issue.department.name if issue.department else "Unassigned"
                    issue.department = target_department
                    issue.status = IssueStatus.SUBMITTED # Rerouted issue returns to intake queue of target department
                    remarks = f"Transferred from {prev_dept_name} to {target_department.name}. Reason: {rejection_reason}. {rejection_notes or remarks}".strip()

            if to_status == IssueStatus.ASSIGNED and assigned_worker:
                old_worker = issue.assigned_worker
                if old_worker and old_worker != assigned_worker and hasattr(old_worker, 'worker_profile'):
                    # Decrement previous worker active task count
                    old_worker.worker_profile.active_task_count = max(0, old_worker.worker_profile.active_task_count - 1)
                    old_worker.worker_profile.save(update_fields=['active_task_count'])

                issue.assigned_worker = assigned_worker
                issue.assigned_by = user

                # Increment new worker active task count
                if hasattr(assigned_worker, 'worker_profile'):
                    assigned_worker.worker_profile.active_task_count += 1
                    assigned_worker.worker_profile.save(update_fields=['active_task_count'])

                IssueAssignment.objects.create(
                    issue=issue,
                    worker=assigned_worker,
                    assigned_by=user,
                    notes=remarks,
                    is_active=True
                )

            issue.save()

            # 3. Create Status History entry
            history_remarks = remarks or f"Status changed from {from_status} to {to_status}."
            if rejection_reason and to_status == IssueStatus.REJECTED:
                history_remarks = f"Rejected: {rejection_reason}. {rejection_notes}".strip()

            IssueStatusHistory.objects.create(
                issue=issue,
                from_status=from_status,
                to_status=issue.status, # Use actual issue.status in case of re-routing reset
                changed_by=user,
                remarks=history_remarks
            )

            # 4. Create Audit Log entry
            audit_action = f"STATUS_CHANGE_{from_status}_TO_{issue.status}"
            if is_reassign:
                audit_action = "WORKER_REASSIGNED"
            elif to_status == IssueStatus.REJECTED and target_department:
                audit_action = "ISSUE_REROUTED"

            AuditLog.objects.create(
                issue=issue,
                actor=user,
                role=user.role,
                action=audit_action,
                details={
                    "from_status": from_status,
                    "to_status": issue.status,
                    "remarks": history_remarks,
                    "rejection_reason": rejection_reason if to_status == IssueStatus.REJECTED else None,
                    "assigned_worker_id": assigned_worker.id if assigned_worker else None,
                    "assigned_worker_name": assigned_worker.get_full_name() or assigned_worker.username if assigned_worker else None,
                    "priority": issue.priority,
                    "department": issue.department.name if issue.department else None,
                },
                ip_address=ip_address
            )

            # 5. Dispatch in-app notifications
            cls.dispatch_notifications(issue, from_status, issue.status, user, remarks, assigned_worker)

        return issue

    @classmethod
    def dispatch_notifications(cls, issue: Issue, from_status: str, to_status: str, actor: User, remarks: str, assigned_worker: User = None):
        """Dispatches in-app notification records to concerned stakeholders."""
        link_url = f"/track/{issue.issue_id}"

        # 1. Notify Citizen
        citizen_titles = {
            IssueStatus.UNDER_REVIEW: f"Grievance {issue.issue_id} is Under Review",
            IssueStatus.ACCEPTED: f"Grievance {issue.issue_id} has been Accepted",
            IssueStatus.REJECTED: f"Update regarding Grievance {issue.issue_id}",
            IssueStatus.ASSIGNED: f"Field Worker Assigned for {issue.issue_id}",
            IssueStatus.ON_THE_WAY: f"Worker is on the way for {issue.issue_id}",
            IssueStatus.ARRIVED: f"Worker arrived at location for {issue.issue_id}",
            IssueStatus.WORK_STARTED: f"Repair work started on {issue.issue_id}",
            IssueStatus.IN_PROGRESS: f"Work in progress on {issue.issue_id}",
            IssueStatus.DONE: f"Work completed on {issue.issue_id} - Awaiting Verification",
            IssueStatus.VERIFIED: f"Issue {issue.issue_id} Verified & Resolved",
            IssueStatus.CLOSED: f"Issue {issue.issue_id} Closed",
            IssueStatus.REOPENED: f"Issue {issue.issue_id} Reopened",
        }

        citizen_messages = {
            IssueStatus.UNDER_REVIEW: f"Department officers from {issue.department.name if issue.department else 'Municipal Office'} are actively inspecting your report.",
            IssueStatus.ACCEPTED: f"Your issue '{issue.title}' has been accepted into the active municipal repair schedule.",
            IssueStatus.REJECTED: f"Your report was reviewed: {issue.rejection_reason}. {issue.rejection_notes or ''}",
            IssueStatus.ASSIGNED: f"Assigned to field technician for dispatch and on-site resolution.",
            IssueStatus.ON_THE_WAY: f"The field team has departed for the site location ({issue.location.address_text if hasattr(issue, 'location') else ''}).",
            IssueStatus.ARRIVED: "The field team has arrived on site and is preparing tools.",
            IssueStatus.WORK_STARTED: "Ground repair operations have commenced.",
            IssueStatus.IN_PROGRESS: "Ground repair operations are actively in progress.",
            IssueStatus.DONE: "Field work is finished. Supervisor inspection in progress.",
            IssueStatus.VERIFIED: "Repairs have been inspected and verified by municipal supervisors. Please review completion evidence.",
            IssueStatus.CLOSED: "This grievance ticket has been closed. Thank you for making our city better.",
            IssueStatus.REOPENED: "You have reopened this ticket. It has returned to the department triage desk.",
        }

        if issue.citizen and to_status in citizen_titles:
            Notification.objects.create(
                user=issue.citizen,
                title=citizen_titles[to_status],
                message=citizen_messages.get(to_status, remarks or citizen_titles[to_status]),
                notification_type='STATUS_UPDATE',
                link=link_url
            )

        # 2. Notify Assigned Worker
        if to_status == IssueStatus.ASSIGNED and assigned_worker:
            Notification.objects.create(
                user=assigned_worker,
                title=f"New Task Order: {issue.issue_id}",
                message=f"You have been assigned to '{issue.title}' in {issue.location.ward or 'your area'}. Address: {issue.location.address_text if hasattr(issue, 'location') else ''}",
                notification_type='WORKER_ASSIGNED',
                link=f"/worker"
            )

        # 3. Notify Department Officers / Supervisors if issue reopened
        if to_status == IssueStatus.REOPENED and issue.department:
            officers = User.objects.filter(
                department=issue.department,
                role__in=[Role.DEPARTMENT_OFFICER, Role.SUPERVISOR]
            )
            for off in officers:
                Notification.objects.create(
                    user=off,
                    title=f"Ticket Reopened: {issue.issue_id}",
                    message=f"Citizen {issue.citizen.get_full_name() or issue.citizen.username} reported that issue '{issue.title}' is not resolved.",
                    notification_type='STATUS_UPDATE',
                    link="/officer"
                )
