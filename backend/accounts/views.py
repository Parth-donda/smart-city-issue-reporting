from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, RegisterSerializer, WorkerProfileSerializer
from .models import Role, WorkerProfile
from .permissions import IsMunicipalAdmin, IsOfficerOrSupervisor

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate JWT tokens for instant sign-in upon registration
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user, context=self.get_serializer_context()).data

        return Response({
            "user": user_data,
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            "message": "Registration successful."
        }, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class WorkerListView(generics.ListAPIView):
    """
    List field workers within a department for assignment tasks.
    Only accessible by Department Officers, Supervisors, and Municipal Admins.
    """
    serializer_class = WorkerProfileSerializer
    permission_classes = (IsOfficerOrSupervisor,)

    def get_queryset(self):
        dept_id = self.request.query_params.get('department_id')
        queryset = WorkerProfile.objects.select_related('user', 'department').filter(is_available=True)
        if dept_id:
            queryset = queryset.filter(department_id=dept_id)
        return queryset
