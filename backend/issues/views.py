from rest_framework import generics, status, permissions, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q, Count
from django.utils import timezone
from .models import Issue, IssueCategory, IssueStatus, IssuePriority, IssueRejectionReason, SLAConfiguration
from .serializers import (
    IssueCategorySerializer, IssueListSerializer, IssueDetailSerializer, IssueCreateSerializer,
    SLAConfigurationSerializer
)
from .services.lifecycle import LifecycleService, IllegalTransitionError
from accounts.models import User, Role
from departments.models import Department
from accounts.permissions import IsOfficerOrSupervisor


class IssueCategoryListView(generics.ListAPIView):
    """
    Public / Authenticated endpoint to list all available issue reporting categories.
    """
    queryset = IssueCategory.objects.filter(is_active=True)
    serializer_class = IssueCategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class IssueSummaryView(APIView):
    """
    Returns aggregated KPI queue statistics scoped to the user's role and department.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = Issue.objects.all()

        dept_param = request.query_params.get('department')
        if user.role == Role.CITIZEN:
            qs = qs.filter(citizen=user)
        elif user.role in [Role.DEPARTMENT_OFFICER, Role.SUPERVISOR]:
            if dept_param == 'ALL':
                pass
            elif dept_param and dept_param != 'ALL':
                if dept_param.isdigit():
                    qs = qs.filter(department_id=dept_param)
                else:
                    qs = qs.filter(department__code=dept_param)
            elif user.department:
                qs = qs.filter(department=user.department)
        elif user.role == Role.WORKER:
            qs = qs.filter(assigned_worker=user)
        elif user.role in [Role.MUNICIPAL_ADMIN, Role.SYSTEM_ADMIN]:
            if dept_param and dept_param != 'ALL':
                if dept_param.isdigit():
                    qs = qs.filter(department_id=dept_param)
                else:
                    qs = qs.filter(department__code=dept_param)

        now = timezone.now()
        warning_window = now + timezone.timedelta(hours=6)

        total = qs.count()
        submitted = qs.filter(status=IssueStatus.SUBMITTED).count()
        under_review = qs.filter(status=IssueStatus.UNDER_REVIEW).count()
        accepted = qs.filter(status=IssueStatus.ACCEPTED).count()
        assigned = qs.filter(status=IssueStatus.ASSIGNED).count()
        on_the_way = qs.filter(status=IssueStatus.ON_THE_WAY).count()
        arrived = qs.filter(status=IssueStatus.ARRIVED).count()
        work_started = qs.filter(status=IssueStatus.WORK_STARTED).count()
        in_progress = qs.filter(status=IssueStatus.IN_PROGRESS).count()
        done = qs.filter(status=IssueStatus.DONE).count()
        verified = qs.filter(status=IssueStatus.VERIFIED).count()
        closed = qs.filter(status=IssueStatus.CLOSED).count()
        rejected = qs.filter(status=IssueStatus.REJECTED).count()
        reopened = qs.filter(status=IssueStatus.REOPENED).count()

        active_statuses = [
            IssueStatus.SUBMITTED, IssueStatus.UNDER_REVIEW, IssueStatus.ACCEPTED,
            IssueStatus.ASSIGNED, IssueStatus.ON_THE_WAY, IssueStatus.ARRIVED,
            IssueStatus.WORK_STARTED, IssueStatus.IN_PROGRESS, IssueStatus.REOPENED
        ]

        # SLA checks
        sla_breached = qs.filter(
            status__in=active_statuses,
            sla_deadline__isnull=False,
            sla_deadline__lt=now
        ).count()

        sla_approaching = qs.filter(
            status__in=active_statuses,
            sla_deadline__isnull=False,
            sla_deadline__gte=now,
            sla_deadline__lte=warning_window
        ).count()

        return Response({
            'total': total,
            'submitted': submitted,
            'under_review': under_review,
            'accepted': accepted,
            'assigned': assigned,
            'on_the_way': on_the_way,
            'arrived': arrived,
            'work_started': work_started,
            'in_progress': in_progress,
            'done': done,
            'verified': verified,
            'closed': closed,
            'rejected': rejected,
            'reopened': reopened,
            'sla_breached': sla_breached,
            'sla_approaching': sla_approaching,
            'department_name': user.department.name if getattr(user, 'department', None) else None,
            'department_code': user.department.code if getattr(user, 'department', None) else None,
        })


class IssueListCreateView(generics.ListCreateAPIView):
    """
    GET: List issues based on user role, department boundaries, and query parameters.
    POST: Create a new issue report (with multipart photo/video uploads).
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'issue_id', 'location__address_text', 'location__ward', 'citizen__first_name', 'citizen__last_name']
    ordering_fields = ['created_at', 'priority', 'status', 'sla_deadline']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return IssueCreateSerializer
        return IssueListSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Issue.objects.select_related('category', 'department', 'citizen', 'location', 'assigned_worker').prefetch_related('images')

        # Filter by role
        dept_param = self.request.query_params.get('department')
        if user.role == Role.CITIZEN:
            queryset = queryset.filter(citizen=user)
        elif user.role in [Role.DEPARTMENT_OFFICER, Role.SUPERVISOR]:
            if dept_param == 'ALL':
                pass # Allow cross-department inspection
            elif dept_param and dept_param != 'ALL':
                if dept_param.isdigit():
                    queryset = queryset.filter(department_id=dept_param)
                else:
                    queryset = queryset.filter(department__code=dept_param)
            elif user.department:
                queryset = queryset.filter(department=user.department)
        elif user.role == Role.WORKER:
            queryset = queryset.filter(assigned_worker=user)
        elif user.role in [Role.MUNICIPAL_ADMIN, Role.SYSTEM_ADMIN]:
            if dept_param and dept_param != 'ALL':
                if dept_param.isdigit():
                    queryset = queryset.filter(department_id=dept_param)
                else:
                    queryset = queryset.filter(department__code=dept_param)

        # Tab filtering shortcut
        tab_param = self.request.query_params.get('tab')
        now = timezone.now()
        if tab_param == 'submitted':
            queryset = queryset.filter(status=IssueStatus.SUBMITTED)
        elif tab_param == 'under_review':
            queryset = queryset.filter(status=IssueStatus.UNDER_REVIEW)
        elif tab_param == 'accepted':
            queryset = queryset.filter(status=IssueStatus.ACCEPTED)
        elif tab_param == 'assigned':
            queryset = queryset.filter(status=IssueStatus.ASSIGNED)
        elif tab_param == 'in_progress':
            queryset = queryset.filter(status__in=[
                IssueStatus.ASSIGNED, IssueStatus.ON_THE_WAY, IssueStatus.ARRIVED,
                IssueStatus.WORK_STARTED, IssueStatus.IN_PROGRESS
            ])
        elif tab_param == 'resolved':
            queryset = queryset.filter(status__in=[IssueStatus.DONE, IssueStatus.VERIFIED, IssueStatus.CLOSED])
        elif tab_param == 'rejected':
            queryset = queryset.filter(status=IssueStatus.REJECTED)
        elif tab_param == 'reopened':
            queryset = queryset.filter(status=IssueStatus.REOPENED)
        elif tab_param == 'sla_breached':
            queryset = queryset.filter(
                sla_deadline__isnull=False,
                sla_deadline__lt=now
            ).exclude(status__in=[IssueStatus.DONE, IssueStatus.VERIFIED, IssueStatus.CLOSED, IssueStatus.REJECTED])

        # Specific field filters
        status_param = self.request.query_params.get('status')
        if status_param and status_param != 'ALL':
            queryset = queryset.filter(status=status_param)

        category_param = self.request.query_params.get('category')
        if category_param and category_param != 'ALL':
            queryset = queryset.filter(category_id=category_param)

        priority_param = self.request.query_params.get('priority')
        if priority_param and priority_param != 'ALL':
            queryset = queryset.filter(priority=priority_param)

        ward_param = self.request.query_params.get('ward')
        if ward_param:
            queryset = queryset.filter(location__ward__icontains=ward_param)

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        issue = serializer.save()

        # Run Evidence Verification Pipeline inline
        from evidence.services.verification import EvidenceVerificationService
        EvidenceVerificationService.verify_issue_evidence(issue)

        detail_serializer = IssueDetailSerializer(issue, context={'request': request})
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)


class IssueDetailView(generics.RetrieveAPIView):
    """
    Retrieve full issue details by issue_id (e.g. SC-2026-00001) or primary key id.
    """
    queryset = Issue.objects.select_related(
        'category', 'department', 'citizen', 'assigned_worker', 'location'
    ).prefetch_related('images', 'videos', 'status_history')
    serializer_class = IssueDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        lookup = self.kwargs.get('lookup')
        queryset = self.get_queryset()
        
        if lookup.isdigit():
            obj = generics.get_object_or_404(queryset, id=int(lookup))
        else:
            obj = generics.get_object_or_404(queryset, issue_id=lookup)

        # Ensure evidence verification exists
        if not hasattr(obj, 'evidence_verification') or not obj.evidence_verification:
            from evidence.services.verification import EvidenceVerificationService
            EvidenceVerificationService.verify_issue_evidence(obj)

        user = self.request.user
        if user.role == Role.CITIZEN and obj.citizen_id != user.id:
            self.permission_denied(self.request, message="You do not have permission to view this issue.")

        return obj


def _get_issue_by_lookup(lookup):
    if lookup.isdigit():
        return generics.get_object_or_404(Issue, id=int(lookup))
    return generics.get_object_or_404(Issue, issue_id=lookup)


class IssueStartReviewView(APIView):
    """
    Officer/Supervisor begins inspection, shifting status to UNDER_REVIEW.
    """
    permission_classes = [permissions.IsAuthenticated, IsOfficerOrSupervisor]

    def post(self, request, lookup):
        issue = _get_issue_by_lookup(lookup)
        if issue.status == IssueStatus.SUBMITTED:
            issue = LifecycleService.transition(
                issue=issue,
                to_status=IssueStatus.UNDER_REVIEW,
                user=request.user,
                remarks="Officer opened issue for triage and verification review.",
                ip_address=request.META.get('REMOTE_ADDR')
            )
        serializer = IssueDetailSerializer(issue, context={'request': request})
        return Response(serializer.data)


class IssueAcceptView(APIView):
    """
    Officer/Supervisor accepts the issue, optionally adjusting priority and adding remarks.
    """
    permission_classes = [permissions.IsAuthenticated, IsOfficerOrSupervisor]

    def post(self, request, lookup):
        issue = _get_issue_by_lookup(lookup)
        priority = request.data.get('priority')
        remarks = request.data.get('remarks', 'Issue accepted for municipal work order dispatch.')

        issue = LifecycleService.transition(
            issue=issue,
            to_status=IssueStatus.ACCEPTED,
            user=request.user,
            remarks=remarks,
            new_priority=priority,
            ip_address=request.META.get('REMOTE_ADDR')
        )
        serializer = IssueDetailSerializer(issue, context={'request': request})
        return Response(serializer.data)


class IssueRejectView(APIView):
    """
    Officer/Supervisor rejects an issue with a REQUIRED reason and remarks.
    Can optionally re-route to another department if reason is OUTSIDE_RESPONSIBILITY.
    """
    permission_classes = [permissions.IsAuthenticated, IsOfficerOrSupervisor]

    def post(self, request, lookup):
        issue = _get_issue_by_lookup(lookup)
        rejection_reason = request.data.get('rejection_reason')
        rejection_notes = request.data.get('rejection_notes', '')
        target_department_id = request.data.get('target_department_id')

        target_department = None
        if target_department_id:
            try:
                target_department = Department.objects.get(id=target_department_id, is_active=True)
            except Department.DoesNotExist:
                return Response({'error': 'Target department does not exist.'}, status=status.HTTP_400_BAD_REQUEST)

        issue = LifecycleService.transition(
            issue=issue,
            to_status=IssueStatus.REJECTED,
            user=request.user,
            remarks=rejection_notes,
            rejection_reason=rejection_reason,
            rejection_notes=rejection_notes,
            target_department=target_department,
            ip_address=request.META.get('REMOTE_ADDR')
        )
        serializer = IssueDetailSerializer(issue, context={'request': request})
        return Response(serializer.data)


class IssueAssignWorkerView(APIView):
    """
    Officer/Supervisor assigns a field worker to an ACCEPTED or ASSIGNED issue.
    """
    permission_classes = [permissions.IsAuthenticated, IsOfficerOrSupervisor]

    def post(self, request, lookup):
        issue = _get_issue_by_lookup(lookup)
        worker_id = request.data.get('worker_id')
        notes = request.data.get('notes', 'Field worker assigned for on-site inspection and repair.')

        if not worker_id:
            return Response({'worker_id': 'Worker selection is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            worker = User.objects.get(id=worker_id, role=Role.WORKER)
        except User.DoesNotExist:
            return Response({'worker_id': 'Selected worker was not found.'}, status=status.HTTP_404_NOT_FOUND)

        issue = LifecycleService.transition(
            issue=issue,
            to_status=IssueStatus.ASSIGNED,
            user=request.user,
            remarks=notes,
            assigned_worker=worker,
            ip_address=request.META.get('REMOTE_ADDR')
        )
        serializer = IssueDetailSerializer(issue, context={'request': request})
        return Response(serializer.data)


class IssueChangePriorityView(APIView):
    """
    Officer/Supervisor confirms or overrides issue priority with audit recording.
    """
    permission_classes = [permissions.IsAuthenticated, IsOfficerOrSupervisor]

    def post(self, request, lookup):
        issue = _get_issue_by_lookup(lookup)
        new_priority = request.data.get('priority')
        remarks = request.data.get('remarks', f"Priority updated to {new_priority}.")

        if not new_priority or new_priority not in IssuePriority.values:
            return Response({'priority': f'Invalid priority. Must be one of {IssuePriority.values}.'}, status=status.HTTP_400_BAD_REQUEST)

        old_priority = issue.priority
        issue.priority = new_priority
        issue.sla_deadline = LifecycleService.calculate_sla_deadline(new_priority, base_time=issue.created_at)
        issue.save()

        from audit.models import AuditLog
        AuditLog.objects.create(
            issue=issue,
            actor=request.user,
            role=request.user.role,
            action="PRIORITY_CHANGED",
            details={
                "old_priority": old_priority,
                "new_priority": new_priority,
                "remarks": remarks
            },
            ip_address=request.META.get('REMOTE_ADDR')
        )

        serializer = IssueDetailSerializer(issue, context={'request': request})
        return Response(serializer.data)


class IssueRerouteView(APIView):
    """
    Direct re-routing of an issue to another department.
    """
    permission_classes = [permissions.IsAuthenticated, IsOfficerOrSupervisor]

    def post(self, request, lookup):
        issue = _get_issue_by_lookup(lookup)
        target_department_id = request.data.get('target_department_id')
        reason = request.data.get('reason', 'Transferred to appropriate municipal department.')

        if not target_department_id:
            return Response({'target_department_id': 'Target department is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_dept = Department.objects.get(id=target_department_id, is_active=True)
        except Department.DoesNotExist:
            return Response({'target_department_id': 'Department not found.'}, status=status.HTTP_404_NOT_FOUND)

        prev_dept_name = issue.department.name if issue.department else "Unassigned"
        issue.department = target_dept
        issue.status = IssueStatus.SUBMITTED
        issue.save()

        from issues.models import IssueStatusHistory
        from audit.models import AuditLog
        remarks_text = f"Re-routed from {prev_dept_name} to {target_dept.name}. Note: {reason}"
        IssueStatusHistory.objects.create(
            issue=issue,
            from_status=issue.status,
            to_status=IssueStatus.SUBMITTED,
            changed_by=request.user,
            remarks=remarks_text
        )

        AuditLog.objects.create(
            issue=issue,
            actor=request.user,
            role=request.user.role,
            action="ISSUE_REROUTED",
            details={
                "from_department": prev_dept_name,
                "to_department": target_dept.name,
                "reason": reason
            },
            ip_address=request.META.get('REMOTE_ADDR')
        )

        serializer = IssueDetailSerializer(issue, context={'request': request})
        return Response(serializer.data)


class IssueTrackPublicView(generics.GenericAPIView):
    """
    Public lookup for citizens tracking an issue with reference ID.
    Returns status progress without exposing private citizen data.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, issue_id):
        issue = generics.get_object_or_404(
            Issue.objects.select_related('category', 'department', 'location', 'completion_evidence').prefetch_related('images', 'status_history'),
            issue_id=issue_id
        )

        history_data = [
            {
                'from_status': h.from_status,
                'to_status': h.to_status,
                'remarks': h.remarks,
                'created_at': h.created_at
            }
            for h in issue.status_history.all()
        ]

        images_data = [
            {
                'id': img.id,
                'image': request.build_absolute_uri(img.image.url) if img.image else None,
                'caption': img.caption,
                'is_primary': img.is_primary
            }
            for img in issue.images.all()
        ]

        time_remaining = None
        if issue.sla_deadline:
            time_remaining = int((issue.sla_deadline - timezone.now()).total_seconds())

        completion_data = None
        if hasattr(issue, 'completion_evidence') and issue.completion_evidence:
            ce = issue.completion_evidence
            completion_data = {
                'after_image': request.build_absolute_uri(ce.after_image.url) if ce.after_image else None,
                'description': ce.description,
                'materials_used': ce.materials_used,
                'completed_at': ce.completed_at
            }

        data = {
            'issue_id': issue.issue_id,
            'title': issue.title,
            'description': issue.description,
            'status': issue.status,
            'status_display': issue.get_status_display(),
            'priority': issue.priority,
            'priority_display': issue.get_priority_display(),
            'category_name': issue.category.name if issue.category else 'General',
            'department_name': issue.department.name if issue.department else None,
            'address_text': issue.location.address_text if hasattr(issue, 'location') else '',
            'ward': issue.location.ward if hasattr(issue, 'location') else '',
            'created_at': issue.created_at,
            'sla_deadline': issue.sla_deadline,
            'time_remaining_seconds': time_remaining,
            'images': images_data,
            'timeline': history_data,
            'completion_evidence': completion_data
        }

        return Response(data)


class IssueWorkerTransitionView(APIView):
    """
    Worker moves status forward: ON_THE_WAY -> ARRIVED -> WORK_STARTED -> IN_PROGRESS.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, lookup):
        issue = _get_issue_by_lookup(lookup)
        user = request.user

        if user.role != Role.WORKER and not user.is_superuser:
            return Response({'error': 'Only assigned workers can perform field progress updates.'}, status=status.HTTP_403_FORBIDDEN)

        if issue.assigned_worker_id != user.id and not user.is_superuser:
            return Response({'error': 'You can only update tasks assigned directly to you.'}, status=status.HTTP_403_FORBIDDEN)

        to_status = request.data.get('to_status')
        remarks = request.data.get('remarks', '')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')

        if not to_status or to_status not in [IssueStatus.ON_THE_WAY, IssueStatus.ARRIVED, IssueStatus.WORK_STARTED, IssueStatus.IN_PROGRESS]:
            return Response({'to_status': 'Invalid worker status transition.'}, status=status.HTTP_400_BAD_REQUEST)

        if latitude and longitude and to_status == IssueStatus.ARRIVED:
            remarks = f"Worker arrived on-site at GPS ({latitude}, {longitude}). {remarks}".strip()

        issue = LifecycleService.transition(
            issue=issue,
            to_status=to_status,
            user=user,
            remarks=remarks,
            ip_address=request.META.get('REMOTE_ADDR')
        )
        serializer = IssueDetailSerializer(issue, context={'request': request})
        return Response(serializer.data)


class IssueCompleteWorkView(APIView):
    """
    Worker completes physical repair and submits mandatory completion evidence (after image + description).
    Transitions status to DONE.
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, lookup):
        issue = _get_issue_by_lookup(lookup)
        user = request.user

        if user.role != Role.WORKER and not user.is_superuser:
            return Response({'error': 'Only assigned field technicians can submit completion proof.'}, status=status.HTTP_403_FORBIDDEN)

        if issue.assigned_worker_id != user.id and not user.is_superuser:
            return Response({'error': 'This task is not assigned to you.'}, status=status.HTTP_403_FORBIDDEN)

        after_image = request.FILES.get('after_image')
        description = request.data.get('description', '').strip()
        materials_used = request.data.get('materials_used', '').strip()
        before_image = request.FILES.get('before_image')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')

        if not after_image:
            return Response({'after_image': 'A mandatory After-repair photo is required as proof of completion.'}, status=status.HTTP_400_BAD_REQUEST)

        if not description:
            return Response({'description': 'A detailed description of the repair work performed is required.'}, status=status.HTTP_400_BAD_REQUEST)

        from .validators import validate_uploaded_image
        validate_uploaded_image(after_image)
        if before_image:
            validate_uploaded_image(before_image)

        from .models import CompletionEvidence
        from django.db import transaction

        with transaction.atomic():
            CompletionEvidence.objects.update_or_create(
                issue=issue,
                defaults={
                    'worker': user,
                    'after_image': after_image,
                    'before_image': before_image,
                    'description': description,
                    'materials_used': materials_used,
                    'latitude': latitude if latitude else None,
                    'longitude': longitude if longitude else None,
                    'completed_at': timezone.now()
                }
            )

            # Decrement worker active task count
            if hasattr(user, 'worker_profile'):
                user.worker_profile.active_task_count = max(0, user.worker_profile.active_task_count - 1)
                user.worker_profile.save(update_fields=['active_task_count'])

            issue = LifecycleService.transition(
                issue=issue,
                to_status=IssueStatus.DONE,
                user=user,
                remarks=f"Field work completed. Notes: {description}",
                ip_address=request.META.get('REMOTE_ADDR')
            )

        serializer = IssueDetailSerializer(issue, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class IssueSupervisorVerifyView(APIView):
    """
    Supervisor verifies completed work or rejects it back to IN_PROGRESS.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, lookup):
        issue = _get_issue_by_lookup(lookup)
        user = request.user

        if user.role not in [Role.SUPERVISOR, Role.DEPARTMENT_OFFICER, Role.MUNICIPAL_ADMIN, Role.SYSTEM_ADMIN] and not user.is_superuser:
            return Response({'error': 'Only department supervisors or municipal officers can verify completed work.'}, status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action') # 'APPROVE' or 'REJECT'
        remarks = request.data.get('remarks', '')

        if action == 'APPROVE':
            issue = LifecycleService.transition(
                issue=issue,
                to_status=IssueStatus.VERIFIED,
                user=user,
                remarks=remarks or "Completion evidence inspected and verified by municipal supervisor.",
                ip_address=request.META.get('REMOTE_ADDR')
            )
        elif action == 'REJECT':
            if not remarks:
                return Response({'remarks': 'Explanation remarks are required when rejecting completion evidence.'}, status=status.HTTP_400_BAD_REQUEST)
            issue = LifecycleService.transition(
                issue=issue,
                to_status=IssueStatus.IN_PROGRESS,
                user=user,
                remarks=f"Completion rejected by supervisor: {remarks}",
                ip_address=request.META.get('REMOTE_ADDR')
            )
        else:
            return Response({'action': "Action must be 'APPROVE' or 'REJECT'."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = IssueDetailSerializer(issue, context={'request': request})
        return Response(serializer.data)


class IssueCitizenFeedbackView(APIView):
    """
    Citizen confirms resolution (marks CLOSED) or reopens the issue if unsatisfied.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, lookup):
        issue = _get_issue_by_lookup(lookup)
        user = request.user

        if user.role == Role.CITIZEN and issue.citizen_id != user.id:
            return Response({'error': 'You can only provide feedback on your own reported issues.'}, status=status.HTTP_403_FORBIDDEN)

        raw_satisfied = request.data.get('is_satisfied', True)
        if isinstance(raw_satisfied, str):
            is_satisfied = raw_satisfied.lower() in ['true', '1', 'yes']
        else:
            is_satisfied = bool(raw_satisfied)

        rating = request.data.get('rating', 5)
        comment = request.data.get('comment', '').strip()

        from .models import CitizenFeedback
        from django.db import transaction

        with transaction.atomic():
            CitizenFeedback.objects.update_or_create(
                issue=issue,
                defaults={
                    'citizen': user,
                    'is_satisfied': is_satisfied,
                    'rating': int(rating) if is_satisfied else 1,
                    'comment': comment,
                    'is_reopened': not is_satisfied
                }
            )

            if is_satisfied:
                issue = LifecycleService.transition(
                    issue=issue,
                    to_status=IssueStatus.CLOSED,
                    user=user,
                    remarks=f"Citizen confirmed resolution. Rating: {rating}/5 stars. Feedback: {comment or 'None'}",
                    ip_address=request.META.get('REMOTE_ADDR')
                )
            else:
                issue = LifecycleService.transition(
                    issue=issue,
                    to_status=IssueStatus.REOPENED,
                    user=user,
                    remarks=f"Citizen reopened issue: {comment or 'Issue not resolved properly.'}",
                    ip_address=request.META.get('REMOTE_ADDR')
                )

        serializer = IssueDetailSerializer(issue, context={'request': request})
        return Response(serializer.data)


class IssueAdminOverviewView(APIView):
    """
    High-level municipal overview statistics for Municipal Admin dashboard.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        issues_qs = Issue.objects.all()

        total = issues_qs.count()
        active = issues_qs.filter(status__in=[
            IssueStatus.SUBMITTED, IssueStatus.UNDER_REVIEW, IssueStatus.ACCEPTED,
            IssueStatus.ASSIGNED, IssueStatus.ON_THE_WAY, IssueStatus.ARRIVED,
            IssueStatus.WORK_STARTED, IssueStatus.IN_PROGRESS, IssueStatus.REOPENED
        ]).count()
        critical = issues_qs.filter(priority=IssuePriority.CRITICAL).count()
        resolved = issues_qs.filter(status__in=[IssueStatus.DONE, IssueStatus.VERIFIED, IssueStatus.CLOSED]).count()
        rejected = issues_qs.filter(status=IssueStatus.REJECTED).count()
        reopened = issues_qs.filter(status=IssueStatus.REOPENED).count()

        breached = issues_qs.filter(
            sla_deadline__isnull=False,
            sla_deadline__lt=now
        ).exclude(status__in=[IssueStatus.DONE, IssueStatus.VERIFIED, IssueStatus.CLOSED, IssueStatus.REJECTED]).count()

        # Breakdown by department
        by_department = []
        for dept in Department.objects.filter(is_active=True):
            dept_count = issues_qs.filter(department=dept).count()
            dept_resolved = issues_qs.filter(department=dept, status__in=[IssueStatus.DONE, IssueStatus.VERIFIED, IssueStatus.CLOSED]).count()
            by_department.append({
                'id': dept.id,
                'name': dept.name,
                'code': dept.code,
                'total_issues': dept_count,
                'resolved_issues': dept_resolved,
            })

        # Breakdown by category
        by_category = [
            {
                'id': cat.id,
                'name': cat.name,
                'code': cat.code,
                'count': issues_qs.filter(category=cat).count()
            }
            for cat in IssueCategory.objects.filter(is_active=True)
        ]

        # Breakdown by status
        by_status = [
            {'status': st[0], 'label': st[1], 'count': issues_qs.filter(status=st[0]).count()}
            for st in IssueStatus.choices
        ]

        return Response({
            'total_issues': total,
            'active_issues': active,
            'critical_issues': critical,
            'resolved_issues': resolved,
            'rejected_issues': rejected,
            'reopened_issues': reopened,
            'sla_breached_issues': breached,
            'by_department': by_department,
            'by_category': by_category,
            'by_status': by_status
        })


class SLAConfigurationListView(generics.ListCreateAPIView):
    queryset = SLAConfiguration.objects.all()
    serializer_class = SLAConfigurationSerializer
    permission_classes = [permissions.IsAuthenticated]


class IssueCategoryDetailView(generics.RetrieveUpdateAPIView):
    queryset = IssueCategory.objects.all()
    serializer_class = IssueCategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class IssueCheckDuplicatesView(APIView):
    """
    Search for nearby existing issues during reporting to offer 'I have this problem too' upvoting.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        lat = request.query_params.get('latitude')
        lng = request.query_params.get('longitude')
        category_id = request.query_params.get('category_id')

        from issues.services.duplicate import DuplicateDetectionService
        duplicates = DuplicateDetectionService.find_nearby_duplicates(
            latitude=lat,
            longitude=lng,
            category_id=category_id,
            radius_meters=500
        )
        return Response({'duplicates': duplicates})


class IssueUpvoteView(APIView):
    """
    Citizen indicates 'I have this problem too' on an active issue, raising affected count.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, lookup):
        issue = _get_issue_by_lookup(lookup)
        user = request.user

        from issues.models import IssueUpvote
        from audit.models import AuditLog

        upvote, created = IssueUpvote.objects.get_or_create(issue=issue, citizen=user)
        if created:
            issue.affected_citizens_count = issue.upvotes.count() + 1
            issue.save(update_fields=['affected_citizens_count'])

            AuditLog.objects.create(
                issue=issue,
                actor=user,
                role=user.role,
                action="SAME_PROBLEM_UPVOTED",
                details={"affected_citizens_count": issue.affected_citizens_count},
                ip_address=request.META.get('REMOTE_ADDR')
            )

        serializer = IssueDetailSerializer(issue, context={'request': request})
        return Response({
            'message': 'Grievance support recorded.',
            'affected_citizens_count': issue.affected_citizens_count,
            'issue': serializer.data
        })


