from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from base.models import CustomUser, Camera, Detection, UploadedVideo, UploadVideoDetections
import datetime

class CustomUserModelTest(TestCase):
    def test_user_creation(self):
        user = CustomUser.objects.create_user(email='user@example.com', password='testpass', first_name='John', last_name='Doe')
        self.assertEqual(user.email, 'user@example.com')
        self.assertTrue(user.check_password('testpass'))
        self.assertFalse(user.is_superuser)
        self.assertEqual(user.first_name, 'John')

    def test_create_superuser(self):
        superuser = CustomUser.objects.create_superuser(email='superuser@example.com', password='testpass', first_name='Super', last_name='User')
        self.assertTrue(superuser.is_superuser)
        self.assertTrue(superuser.is_staff)

class CameraModelTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(email='owner@example.com', password='testpass', first_name='Cam', last_name='Owner')

    def test_camera_creation(self):
        camera = Camera.objects.create(
            user=self.user, 
            location="Test Location", 
            installation_date=datetime.date.today(), 
            status="Active"
        )
        self.assertEqual(camera.user.email, 'owner@example.com')
        self.assertEqual(camera.location, "Test Location")

class DetectionModelTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(email='owner@example.com', password='testpass')
        self.camera = Camera.objects.create(
            user=self.user, 
            location="Office", 
            installation_date=datetime.date.today(), 
            status="Operational"
        )

    def test_detection_creation(self):
        detection = Detection.objects.create(
            camera=self.camera, 
            weapon_type="Gun", 
            confidence=88.5
        )
        self.assertEqual(detection.camera, self.camera)
        self.assertEqual(detection.weapon_type, "Gun")
        self.assertAlmostEqual(detection.confidence, 88.5)

class UploadedVideoModelTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(email='user@example.com', password='testpass')
        self.video_file = SimpleUploadedFile("file.mp4", b"file_content", content_type="video/mp4")

    def test_uploaded_video_creation(self):
        video = UploadedVideo.objects.create(
            user=self.user, 
            video=self.video_file
        )
        self.assertEqual(video.user.email, 'user@example.com')
        self.assertTrue(video.video, 'file.mp4')

class UploadVideoDetectionsModelTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(email='user@example.com', password='testpass')
        self.video = UploadedVideo.objects.create(
            user=self.user, 
            video=SimpleUploadedFile("file.mp4", b"file_content", content_type="video/mp4")
        )

    def test_video_detection_creation(self):
        detection = UploadVideoDetections.objects.create(
            uploaded_video=self.video,
            weapon_type="Knife",
            confidence=92.1,
            frame="frame data",
            timestamp=12.345
        )
        self.assertEqual(detection.uploaded_video, self.video)
        self.assertEqual(detection.weapon_type, "Knife")
        self.assertAlmostEqual(detection.confidence, 92.1)
