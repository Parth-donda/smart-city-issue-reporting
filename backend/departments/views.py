from rest_framework import generics, permissions
from .models import Department
from .serializers import DepartmentSerializer


class DepartmentListView(generics.ListAPIView):
    queryset = Department.objects.filter(is_active=True)
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.AllowAny]


class DepartmentDetailView(generics.RetrieveAPIView):
    queryset = Department.objects.filter(is_active=True)
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.AllowAny]


class DepartmentWorkersListView(generics.ListAPIView):
    """
    List field workers belonging to a specific department or the authenticated officer's department.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk=None):
        from accounts.models import WorkerProfile, User, Role
        from rest_framework.response import Response

        user = request.user
        dept_id = pk
        
        # If no pk provided, default to user's assigned department
        if not dept_id and user.department:
            dept_id = user.department_id

        profiles_qs = WorkerProfile.objects.select_related('user', 'department').filter(is_available=True)
        if dept_id:
            profiles_qs = profiles_qs.filter(department_id=dept_id)

        data = [
            {
                'id': wp.user.id,
                'worker_profile_id': wp.id,
                'name': wp.user.get_full_name() or wp.user.username,
                'username': wp.user.username,
                'phone': wp.phone or wp.user.phone,
                'skills': wp.skills,
                'is_available': wp.is_available,
                'active_task_count': wp.active_task_count,
                'department_id': wp.department.id,
                'department_name': wp.department.name,
                'department_code': wp.department.code,
            }
            for wp in profiles_qs
        ]
        return Response(data)
