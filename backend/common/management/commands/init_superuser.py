from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
import os

class Command(BaseCommand):
    help = 'Initialize default admin user if it does not exist'

    def handle(self, *args, **options):
        username = os.getenv('DEFAULT_USER_USERNAME', 'admin')
        password = os.getenv('DEFAULT_USER_PASSWORD', 'adminpassword123')
        email = os.getenv('DEFAULT_USER_EMAIL', 'admin@example.com')

        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username=username, email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f'Successfully created superuser: {username}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Superuser {username} already exists.'))
