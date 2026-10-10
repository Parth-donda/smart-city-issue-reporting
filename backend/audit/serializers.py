from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.get_full_name', read_only=True)
    actor_username = serializers.CharField(source='actor.username', read_only=True)
    issue_id = serializers.CharField(source='issue.issue_id', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'issue', 'issue_id', 'actor', 'actor_name', 'actor_username',
            'role', 'action', 'details', 'ip_address', 'timestamp'
        ]
        read_only_fields = fields
