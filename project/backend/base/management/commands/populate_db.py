from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from base.models import Camera
from django.utils import timezone
from django.db import IntegrityError

class Command(BaseCommand):
    help = 'Populates the database with initial data'

    def handle(self, *args, **options):
        user_model = get_user_model()
        
        # Creating or retrieving the first default user
        try:
            default_user = user_model.objects.create_user(
                email='pmapm@ua.pt',
                password='password',
                first_name='Pedro',
                last_name='Monteiro',
                number='97484',
                phone='969698252',
                city='Aveiro'
            )
            print('Default user created.')
        except IntegrityError:
            print('A user with this email already exists. Retrieving existing user...')
            default_user = user_model.objects.get(email='pmapm@ua.pt')
        
        # Creating or retrieving another user
        try:
            another_user = user_model.objects.create_user(
                email='example@ua.pt',
                password='password123',
                first_name='Example',
                last_name='User',
                number='12345',
                phone='999999999',
                city='Porto'
            )
            print('Another user created.')
        except IntegrityError:
            print('A user with this email already exists. Retrieving existing user...')
            another_user = user_model.objects.get(email='example@ua.pt')

        # Associating cameras for both users
        camera_locations = [("Location 1", default_user), ("Location 2", default_user), ("Location 3", default_user)]
        for location, user in camera_locations:
            Camera.objects.get_or_create(
                user=user, 
                location=location, 
                installation_date=timezone.now().date(), 
                status="Active", 
                video_path=f"videos/{location.replace(' ', '').lower()}.mp4"
            )
        
        self.stdout.write(self.style.SUCCESS('Users and cameras created or updated.'))

        # Superuser creation logic remains unchanged
        if not user_model.objects.filter(email='admin@example.com').exists():
            user_model.objects.create_superuser(
                email='admin@example.com',
                password='adminpassword',
                first_name='Admin',
                last_name='User'
            )
            self.stdout.write(self.style.SUCCESS('Superuser created.'))
        else:
            self.stdout.write(self.style.SUCCESS('Superuser creation skipped.'))
