import io
from PIL import Image
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User, Role, WorkerProfile
from departments.models import Department
from issues.models import (
    Issue, IssueCategory, IssueStatus, IssuePriority, IssueRejectionReason,
    IssueLocation, SLAConfiguration
)
from issues.services.lifecycle import LifecycleService, IllegalTransitionError
from notifications.models import Notification
from audit.models import AuditLog


def create_test_image(filename="test.jpg", format="JPEG", size=(200, 200), color=(255, 0, 0)):
    file_obj = io.BytesIO()
    image = Image.new("RGB", size, color)
    image.save(file_obj, format=format)
    file_obj.seek(0)
    return SimpleUploadedFile(filename, file_obj.read(), content_type=f"image/{format.lower()}")


class IssueAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.department = Department.objects.create(
            name='Roads & Infrastructure',
            code='ROADS'
        )
        self.water_dept = Department.objects.create(
            name='Water Supply & Sewerage',
            code='WATER'
        )
        self.category = IssueCategory.objects.create(
            name='Pothole / Road Damage',
            code='POTHOLE',
            default_department=self.department,
            default_priority=IssuePriority.HIGH,
            icon_name='AlertTriangle'
        )
        SLAConfiguration.objects.create(
            priority=IssuePriority.HIGH,
            response_time_hours=12,
            resolution_time_hours=24,
            warning_threshold_hours=4
        )

        self.citizen = User.objects.create_user(
            username='citizen_test',
            email='citizen@smartcivic.local',
            password='pass123',
            role=Role.CITIZEN,
            first_name='Ananya',
            last_name='Sharma'
        )

        self.officer = User.objects.create_user(
            username='officer_test',
            email='officer@smartcivic.local',
            password='pass123',
            role=Role.DEPARTMENT_OFFICER,
            department=self.department,
            first_name='Vikram',
            last_name='Deshmukh'
        )

        self.supervisor = User.objects.create_user(
            username='supervisor_test',
            email='supervisor@smartcivic.local',
            password='pass123',
            role=Role.SUPERVISOR,
            department=self.department,
            first_name='Anjali',
            last_name='Patil'
        )

        self.worker = User.objects.create_user(
            username='worker_test',
            email='worker@smartcivic.local',
            password='pass123',
            role=Role.WORKER,
            first_name='Rajesh',
            last_name='Kumar'
        )
        self.worker_profile = WorkerProfile.objects.create(
            user=self.worker,
            department=self.department,
            skills='Road repair, asphalt compaction',
            is_available=True,
            active_task_count=0
        )

        self.admin = User.objects.create_user(
            username='admin_test',
            email='admin@smartcivic.local',
            password='pass123',
            role=Role.MUNICIPAL_ADMIN,
            is_staff=True,
            first_name='Kavita',
            last_name='Rao'
        )

    def test_list_categories(self):
        response = self.client.get('/api/issues/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['code'], 'POTHOLE')

    def test_create_issue_with_image(self):
        self.client.force_authenticate(user=self.citizen)
        img = create_test_image('pothole.jpg')

        payload = {
            'title': 'Deep pothole near central library',
            'description': 'Vehicle damage risk. Approx 2 feet wide and 5 inches deep.',
            'category_id': self.category.id,
            'latitude': '19.0760000',
            'longitude': '72.8777000',
            'address_text': 'MG Road, Ward 4',
            'ward': 'Ward 4',
            'images': [img],
            'capture_sources': ['CAMERA']
        }

        response = self.client.post('/api/issues/', payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['issue_id'].startswith('SC-'))
        self.assertEqual(response.data['status'], IssueStatus.SUBMITTED)
        self.assertEqual(response.data['location']['address_text'], 'MG Road, Ward 4')
        self.assertEqual(len(response.data['images']), 1)

    def test_end_to_end_lifecycle_from_submission_to_closure(self):
        # 1. Citizen creates issue
        self.client.force_authenticate(user=self.citizen)
        img = create_test_image('before.jpg')
        res = self.client.post('/api/issues/', {
            'title': 'Road crater repair needed',
            'description': 'Traffic hazard on main street',
            'category_id': self.category.id,
            'latitude': '19.0760000',
            'longitude': '72.8777000',
            'address_text': 'Station Road',
            'images': [img]
        }, format='multipart')
        issue_id = res.data['issue_id']

        # 2. Officer reviews, accepts, and assigns worker
        self.client.force_authenticate(user=self.officer)
        self.client.post(f'/api/issues/{issue_id}/start-review/')
        self.client.post(f'/api/issues/{issue_id}/accept/', {'priority': IssuePriority.HIGH})
        assign_res = self.client.post(f'/api/issues/{issue_id}/assign/', {
            'worker_id': self.worker.id,
            'notes': 'Deploy patch crew immediately.'
        })
        self.assertEqual(assign_res.data['status'], IssueStatus.ASSIGNED)

        # 3. Worker steps: On the Way -> Arrived -> Work Started -> Complete
        self.client.force_authenticate(user=self.worker)
        w1 = self.client.post(f'/api/issues/{issue_id}/worker-transition/', {'to_status': IssueStatus.ON_THE_WAY})
        self.assertEqual(w1.data['status'], IssueStatus.ON_THE_WAY)

        w2 = self.client.post(f'/api/issues/{issue_id}/worker-transition/', {
            'to_status': IssueStatus.ARRIVED,
            'latitude': '19.0760500',
            'longitude': '72.8777200'
        })
        self.assertEqual(w2.data['status'], IssueStatus.ARRIVED)

        w3 = self.client.post(f'/api/issues/{issue_id}/worker-transition/', {'to_status': IssueStatus.WORK_STARTED})
        self.assertEqual(w3.data['status'], IssueStatus.WORK_STARTED)

        # 4. Worker completes work with After photo proof
        after_img = create_test_image('after.jpg')
        comp_res = self.client.post(f'/api/issues/{issue_id}/complete/', {
            'after_image': after_img,
            'description': 'Pothole excavated, hot-mix asphalt laid and roller compacted.',
            'materials_used': '200kg Bituminous asphalt mix, asphalt emulsion, steel roller'
        }, format='multipart')
        self.assertEqual(comp_res.status_code, status.HTTP_200_OK)
        self.assertEqual(comp_res.data['status'], IssueStatus.DONE)
        self.assertIsNotNone(comp_res.data['completion_evidence'])

        # 5. Supervisor verifies completion evidence
        self.client.force_authenticate(user=self.supervisor)
        verify_res = self.client.post(f'/api/issues/{issue_id}/verify/', {
            'action': 'APPROVE',
            'remarks': 'Site inspection confirmed repair meets municipal standards.'
        })
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertEqual(verify_res.data['status'], IssueStatus.VERIFIED)

        # 6. Citizen confirms satisfaction (marks CLOSED)
        self.client.force_authenticate(user=self.citizen)
        feed_res = self.client.post(f'/api/issues/{issue_id}/feedback/', {
            'is_satisfied': True,
            'rating': 5,
            'comment': 'Road is completely smooth now, great work!'
        })
        self.assertEqual(feed_res.status_code, status.HTTP_200_OK)
        self.assertEqual(feed_res.data['status'], IssueStatus.CLOSED)

    def test_citizen_reopen_workflow(self):
        # Create issue and fast-forward to VERIFIED
        self.client.force_authenticate(user=self.citizen)
        res = self.client.post('/api/issues/', {
            'title': 'Broken drainage grill',
            'description': 'Open drain',
            'category_id': self.category.id,
            'latitude': '19.0760000',
            'longitude': '72.8777000',
            'address_text': 'Lane 2',
            'images': [create_test_image('drain.jpg')]
        }, format='multipart')
        issue_id = res.data['issue_id']

        issue = Issue.objects.get(issue_id=issue_id)
        issue.status = IssueStatus.VERIFIED
        issue.save()

        # Citizen reopens
        self.client.force_authenticate(user=self.citizen)
        reopen_res = self.client.post(f'/api/issues/{issue_id}/feedback/', {
            'is_satisfied': False,
            'comment': 'Grill is still loose and rattles when cars drive over.'
        })
        self.assertEqual(reopen_res.status_code, status.HTTP_200_OK)
        self.assertEqual(reopen_res.data['status'], IssueStatus.REOPENED)

    def test_admin_overview_metrics(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.get('/api/issues/admin-overview/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('total_issues', res.data)
        self.assertIn('by_department', res.data)
        self.assertIn('by_category', res.data)
