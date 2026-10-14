from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Role

User = get_user_model()


class AuthAndRBACTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Seed users for tests
        self.citizen = User.objects.create_user(
            username='test_citizen',
            email='citizen@test.local',
            password='Password123!',
            role=Role.CITIZEN
        )
        self.officer = User.objects.create_user(
            username='test_officer',
            email='officer@test.local',
            password='Password123!',
            role=Role.DEPARTMENT_OFFICER
        )
        self.admin = User.objects.create_user(
            username='test_admin',
            email='admin@test.local',
            password='Password123!',
            role=Role.MUNICIPAL_ADMIN,
            is_staff=True
        )

    def test_citizen_registration(self):
        url = reverse('accounts:register')
        payload = {
            'username': 'new_citizen',
            'email': 'new_citizen@test.local',
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!',
            'first_name': 'New',
            'last_name': 'Citizen',
            'phone': '9876543210'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertEqual(response.data['user']['role'], Role.CITIZEN)

    def test_officer_registration_with_role(self):
        url = reverse('accounts:register')
        payload = {
            'username': 'new_officer',
            'email': 'new_officer@test.local',
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!',
            'first_name': 'Officer',
            'last_name': 'Sharma',
            'role': Role.DEPARTMENT_OFFICER,
            'phone': '9876543211'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['role'], Role.DEPARTMENT_OFFICER)

    def test_jwt_login_and_me_endpoint(self):
        url = reverse('accounts:login')
        response = self.client.post(url, {'username': 'test_citizen', 'password': 'Password123!'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

        access_token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        me_url = reverse('accounts:me')
        me_response = self.client.get(me_url)
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data['username'], 'test_citizen')
        self.assertEqual(me_response.data['role'], Role.CITIZEN)

    def test_rbac_citizen_forbidden_from_staff_endpoints(self):
        # Authenticate as citizen
        self.client.force_authenticate(user=self.citizen)

        # Worker list requires Officer/Supervisor/Admin permission
        workers_url = reverse('accounts:workers_list')
        response = self.client.get(workers_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_rbac_officer_allowed_access_to_workers_list(self):
        # Authenticate as officer
        self.client.force_authenticate(user=self.officer)

        workers_url = reverse('accounts:workers_list')
        response = self.client.get(workers_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
