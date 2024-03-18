from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from base.models import Camera
from django.utils import timezone
from django.db import IntegrityError

class Command(BaseCommand):
    help = 'Populates the database with initial data'

    def handle(self, *args, **options):
        user_model = get_user_model()
        
        try:
            default_user = user_model.objects.create_user(
                email='user@example.com',
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
            default_user = user_model.objects.get(email='user@example.com')
        
        Camera.objects.get_or_create(user=default_user, location="Location 1", installation_date=timezone.now().date(), status="Active")
        Camera.objects.get_or_create(user=default_user, location="Location 2", installation_date=timezone.now().date(), status="Active")
        self.stdout.write(self.style.SUCCESS('Default user and camera created or updated.'))

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
