from rest_framework import permissions
from .models import Role


class IsCitizen(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == Role.CITIZEN)


class IsDepartmentOfficer(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and (
                request.user.role == Role.DEPARTMENT_OFFICER or request.user.is_superuser
            )
        )


class IsWorker(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == Role.WORKER)


class IsSupervisor(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and (
                request.user.role == Role.SUPERVISOR or request.user.is_superuser
            )
        )


class IsMunicipalAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and (
                request.user.role in [Role.MUNICIPAL_ADMIN, Role.SYSTEM_ADMIN] or request.user.is_superuser
            )
        )


class IsOfficerOrSupervisor(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and (
                request.user.role in [Role.DEPARTMENT_OFFICER, Role.SUPERVISOR, Role.MUNICIPAL_ADMIN, Role.SYSTEM_ADMIN] or request.user.is_superuser
            )
        )


class IsStaffOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and (
                request.user.role != Role.CITIZEN or request.user.is_superuser
            )
        )
