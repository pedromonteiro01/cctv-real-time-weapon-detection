from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from base.models import CustomUser, Camera, UploadedVideo
from django.core.files.uploadedfile import SimpleUploadedFile

class LoginViewTest(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(email='test@example.com', password='password123')
        self.url = reverse('login')

    def test_login_success(self):
        data = {'username': 'test@example.com', 'password': 'password123'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_login_failure(self):
        data = {'username': 'test@example.com', 'password': 'wrongpassword'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class DetectionListCreateTest(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(email='user@example.com', password='testpass')
        self.camera = Camera.objects.create(user=self.user, location="Test Location", installation_date="2023-01-01", status="Active")
        self.url = reverse('detections')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_post_detection(self):
        data = {
            'camera': self.camera.id,
            'weapon_type': 'weapon',
            'confidence': 99.5,
            'frame': 'data representing the frame'
        }
        response = self.client.post(self.url, data)
        if response.status_code != status.HTTP_201_CREATED:
            print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class UploadVideoTest(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(email='uploader@example.com', password='testpass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = reverse('upload_video')
        self.video = SimpleUploadedFile("test_video.mp4", b"file_content", content_type="video/mp4")

    def test_upload_video(self):
        data = {'video': self.video}
        response = self.client.post(self.url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
