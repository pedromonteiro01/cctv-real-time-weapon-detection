from django.core.management.base import BaseCommand
from django.db import migrations, models
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Apply migrations with defaults for new fields'

    def handle(self, *args, **kwargs):
        # Here, you would programmatically apply migrations or set defaults
        # For simplicity, we're just calling existing commands
        call_command('makemigrations', 'base')
        call_command('migrate', '--fake-initial')
        call_command('migrate')