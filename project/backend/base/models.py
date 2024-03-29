from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if not extra_fields.get('first_name'):
            raise ValueError('Superuser must have a first name.')
        if not extra_fields.get('last_name'):
            raise ValueError('Superuser must have a last name.')

        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30, default='FirstName')
    last_name = models.CharField(max_length=30, default='LastName')
    number = models.CharField(max_length=20, blank=True, null=True, default='')
    phone = models.CharField(max_length=20, blank=True, null=True, default='')
    city = models.CharField(max_length=100, blank=True, null=True, default='')
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = CustomUserManager()

    def __str__(self):
        return self.email

# Camera Model
class Camera(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='cameras')
    location = models.CharField(max_length=255)
    installation_date = models.DateField()
    status = models.CharField(max_length=100)
    video_path = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.location} - {self.status}"

# Detection Model
class Detection(models.Model):
    camera = models.ForeignKey(Camera, on_delete=models.CASCADE)
    date = models.DateField(auto_now_add=True)
    time = models.TimeField(auto_now_add=True) 
    frame = models.TextField() 
    site = models.CharField(max_length=255, default='Unknown')    
    weapon_type = models.CharField(max_length=255, default='Unknown')    
    confidence = models.FloatField(null=True, blank=True)
    
    def __str__(self):
        return f"Detection at {self.timestamp} by Camera {self.camera.id} - {self.weapon_type} with confidence {self.confidence}%"

