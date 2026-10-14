from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Role, WorkerProfile

User = get_user_model()


class WorkerProfileSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    department_code = serializers.ReadOnlyField(source='department.code')

    class Meta:
        model = WorkerProfile
        fields = (
            'id',
            'department',
            'department_name',
            'department_code',
            'phone',
            'skills',
            'is_available',
            'active_task_count',
            'created_at',
        )


class UserSerializer(serializers.ModelSerializer):
    worker_profile = WorkerProfileSerializer(read_only=True)
    department_name = serializers.ReadOnlyField(source='department.name')
    department_code = serializers.ReadOnlyField(source='department.code')

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'department',
            'department_name',
            'department_code',
            'phone',
            'avatar',
            'is_verified',
            'worker_profile',
            'created_at',
        )
        read_only_fields = ('id', 'role', 'is_verified', 'created_at')


from departments.models import Department


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(choices=Role.choices, default=Role.CITIZEN, required=False)
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'password',
            'password_confirm',
            'first_name',
            'last_name',
            'phone',
            'role',
            'department',
        )

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields do not match."})
        role = attrs.get('role', Role.CITIZEN)
        if role == Role.WORKER and not attrs.get('department'):
            first_dept = Department.objects.first()
            if first_dept:
                attrs['department'] = first_dept
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        role = validated_data.get('role', Role.CITIZEN)
        department = validated_data.get('department', None)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            role=role,
            department=department,
            is_staff=role in [Role.MUNICIPAL_ADMIN, Role.SYSTEM_ADMIN],
            is_superuser=role in [Role.SYSTEM_ADMIN],
            is_verified=True,
        )

        if role == Role.WORKER and department:
            WorkerProfile.objects.update_or_create(
                user=user,
                defaults={
                    'department': department,
                    'phone': user.phone,
                    'is_available': True,
                    'active_task_count': 0,
                }
            )

        return user
