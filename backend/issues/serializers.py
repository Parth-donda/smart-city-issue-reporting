from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from .models import (
    Issue, IssueCategory, IssueLocation, IssueImage, IssueVideo,
    IssueStatusHistory, IssueAssignment, CompletionEvidence, CitizenFeedback,
    IssuePriority, IssueStatus, SLAConfiguration
)
from .validators import validate_uploaded_image, validate_uploaded_video
from accounts.serializers import UserSerializer
from departments.serializers import DepartmentSerializer


class IssueCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueCategory
        fields = ['id', 'name', 'code', 'description', 'default_department', 'default_priority', 'icon_name', 'is_active']


class IssueLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueLocation
        fields = ['id', 'latitude', 'longitude', 'address_text', 'landmark', 'ward', 'captured_at']
        read_only_fields = ['id', 'captured_at']


class IssueImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueImage
        fields = ['id', 'image', 'caption', 'is_primary', 'capture_source', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class IssueVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueVideo
        fields = ['id', 'video', 'duration_seconds', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class IssueStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    changed_by_role = serializers.CharField(source='changed_by.role', read_only=True)

    class Meta:
        model = IssueStatusHistory
        fields = ['id', 'from_status', 'to_status', 'changed_by', 'changed_by_name', 'changed_by_role', 'remarks', 'created_at']
        read_only_fields = ['id', 'created_at']


class IssueListSerializer(serializers.ModelSerializer):
    category = IssueCategorySerializer(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    department_code = serializers.CharField(source='department.code', read_only=True)
    location = IssueLocationSerializer(read_only=True)
    citizen_name = serializers.CharField(source='citizen.get_full_name', read_only=True)
    images_count = serializers.IntegerField(source='images.count', read_only=True)
    primary_image = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    time_remaining_seconds = serializers.SerializerMethodField()
    is_approaching_sla = serializers.SerializerMethodField()
    assigned_worker_name = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = [
            'id', 'issue_id', 'title', 'description', 'category', 'department_name', 'department_code',
            'priority', 'priority_display', 'status', 'status_display', 'location', 'citizen_name',
            'images_count', 'primary_image', 'assigned_worker_name',
            'sla_deadline', 'is_sla_breached', 'time_remaining_seconds', 'is_approaching_sla',
            'created_at', 'updated_at'
        ]

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img:
            return IssueImageSerializer(img, context=self.context).data
        return None

    def get_assigned_worker_name(self, obj):
        if obj.assigned_worker:
            return obj.assigned_worker.get_full_name() or obj.assigned_worker.username
        return None

    def get_time_remaining_seconds(self, obj):
        if not obj.sla_deadline:
            return None
        diff = (obj.sla_deadline - timezone.now()).total_seconds()
        return int(diff)

    def get_is_approaching_sla(self, obj):
        if not obj.sla_deadline or obj.status in [IssueStatus.DONE, IssueStatus.VERIFIED, IssueStatus.CLOSED, IssueStatus.REJECTED]:
            return False
        diff_hours = (obj.sla_deadline - timezone.now()).total_seconds() / 3600
        # If remaining time is less than 4 hours (or positive but small), flag as approaching
        return 0 < diff_hours <= 6


class CompletionEvidenceSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source='worker.get_full_name', read_only=True)

    class Meta:
        model = CompletionEvidence
        fields = [
            'id', 'worker', 'worker_name', 'after_image', 'before_image',
            'description', 'materials_used', 'latitude', 'longitude', 'completed_at'
        ]
        read_only_fields = ['id', 'worker', 'completed_at']


class CitizenFeedbackSerializer(serializers.ModelSerializer):
    citizen_name = serializers.CharField(source='citizen.get_full_name', read_only=True)

    class Meta:
        model = CitizenFeedback
        fields = [
            'id', 'citizen', 'citizen_name', 'is_satisfied', 'rating', 'comment', 'is_reopened', 'submitted_at'
        ]
        read_only_fields = ['id', 'citizen', 'submitted_at']


class SLAConfigurationSerializer(serializers.ModelSerializer):
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = SLAConfiguration
        fields = ['id', 'priority', 'priority_display', 'response_time_hours', 'resolution_time_hours', 'warning_threshold_hours']


from evidence.serializers import EvidenceVerificationSerializer


class IssueDetailSerializer(serializers.ModelSerializer):
    category = IssueCategorySerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    citizen = UserSerializer(read_only=True)
    assigned_worker = UserSerializer(read_only=True)
    location = IssueLocationSerializer(read_only=True)
    images = IssueImageSerializer(many=True, read_only=True)
    videos = IssueVideoSerializer(many=True, read_only=True)
    status_history = IssueStatusHistorySerializer(many=True, read_only=True)
    completion_evidence = CompletionEvidenceSerializer(read_only=True)
    feedback = CitizenFeedbackSerializer(read_only=True)
    evidence_verification = EvidenceVerificationSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    rejection_reason_display = serializers.CharField(source='get_rejection_reason_display', read_only=True)
    time_remaining_seconds = serializers.SerializerMethodField()
    is_approaching_sla = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = [
            'id', 'issue_id', 'title', 'description', 'category', 'department',
            'priority', 'priority_display', 'status', 'status_display', 'citizen',
            'assigned_worker', 'assigned_by',
            'location', 'images', 'videos', 'status_history',
            'completion_evidence', 'feedback', 'evidence_verification',
            'rejection_reason', 'rejection_reason_display', 'rejection_notes',
            'sla_deadline', 'is_sla_breached', 'time_remaining_seconds', 'is_approaching_sla',
            'created_at', 'updated_at'
        ]

    def get_time_remaining_seconds(self, obj):
        if not obj.sla_deadline:
            return None
        diff = (obj.sla_deadline - timezone.now()).total_seconds()
        return int(diff)

    def get_is_approaching_sla(self, obj):
        if not obj.sla_deadline or obj.status in [IssueStatus.DONE, IssueStatus.VERIFIED, IssueStatus.CLOSED, IssueStatus.REJECTED]:
            return False
        diff_hours = (obj.sla_deadline - timezone.now()).total_seconds() / 3600
        return 0 < diff_hours <= 6


class IssueCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    description = serializers.CharField()
    category_id = serializers.IntegerField()
    priority = serializers.ChoiceField(choices=IssuePriority.choices, required=False)
    
    # Location fields
    latitude = serializers.DecimalField(max_digits=10, decimal_places=7)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=7)
    address_text = serializers.CharField(max_length=350)
    landmark = serializers.CharField(max_length=200, required=False, allow_blank=True, default='')
    ward = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')

    # Images passed as uploaded files in request.FILES
    def validate_category_id(self, value):
        try:
            category = IssueCategory.objects.get(id=value, is_active=True)
            return category
        except IssueCategory.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive issue category.")

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user
        category = validated_data.pop('category_id')
        
        # Extract location data
        latitude = validated_data.pop('latitude')
        longitude = validated_data.pop('longitude')
        address_text = validated_data.pop('address_text')
        landmark = validated_data.pop('landmark', '')
        ward = validated_data.pop('ward', '')
        
        priority = validated_data.get('priority') or category.default_priority
        department = category.default_department

        # Calculate SLA deadline if SLA config exists for this priority
        sla_deadline = None
        sla_config = SLAConfiguration.objects.filter(priority=priority).first()
        if sla_config:
            sla_deadline = timezone.now() + timezone.timedelta(hours=sla_config.resolution_time_hours)

        with transaction.atomic():
            issue = Issue.objects.create(
                citizen=user,
                title=validated_data['title'],
                description=validated_data['description'],
                category=category,
                department=department,
                priority=priority,
                status=IssueStatus.SUBMITTED,
                sla_deadline=sla_deadline
            )

            IssueLocation.objects.create(
                issue=issue,
                latitude=latitude,
                longitude=longitude,
                address_text=address_text,
                landmark=landmark,
                ward=ward
            )

            # Record initial status history
            IssueStatusHistory.objects.create(
                issue=issue,
                from_status=IssueStatus.SUBMITTED,
                to_status=IssueStatus.SUBMITTED,
                changed_by=user,
                remarks='Issue submitted by citizen.'
            )

            # Process attached images from request.FILES
            if request and request.FILES:
                images = request.FILES.getlist('images')
                capture_sources = request.data.getlist('capture_sources') if hasattr(request.data, 'getlist') else []
                captions = request.data.getlist('captions') if hasattr(request.data, 'getlist') else []

                for index, image_file in enumerate(images):
                    validate_uploaded_image(image_file)
                    source = capture_sources[index] if index < len(capture_sources) else 'CAMERA'
                    caption = captions[index] if index < len(captions) else ''
                    IssueImage.objects.create(
                        issue=issue,
                        image=image_file,
                        caption=caption,
                        is_primary=(index == 0),
                        capture_source=source if source in ['CAMERA', 'GALLERY'] else 'CAMERA'
                    )

                # Process attached videos if any
                videos = request.FILES.getlist('videos')
                for video_file in videos:
                    validate_uploaded_video(video_file)
                    IssueVideo.objects.create(
                        issue=issue,
                        video=video_file
                    )

        return issue
