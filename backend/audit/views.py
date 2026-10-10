from rest_framework import generics, permissions, filters
from .models import AuditLog
from .serializers import AuditLogSerializer
from accounts.permissions import IsMunicipalAdmin, IsStaffOrAdmin


class AuditLogListView(generics.ListAPIView):
    """
    List audit logs for municipal admin review.
    Filterable by issue, actor, action, or date.
    """
    queryset = AuditLog.objects.select_related('actor', 'issue').all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['issue__issue_id', 'actor__username', 'actor__first_name', 'action', 'role']
    ordering_fields = ['timestamp', 'action']
    ordering = ['-timestamp']

    def get_queryset(self):
        qs = super().get_queryset()
        issue_id = self.request.query_params.get('issue_id')
        if issue_id:
            qs = qs.filter(issue__issue_id=issue_id)
        return qs[:100]
