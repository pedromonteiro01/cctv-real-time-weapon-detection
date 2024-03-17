#!/bin/bash

# Wait for the database to be ready
until mysql -h "mysql" -u "user" -p"userpassword" -e "SELECT 1"; do
    >&2 echo "MySQL is unavailable - sleeping"
    sleep 1
done

# Migrate the database
python manage.py migrate

# Create a user (modify as needed)
echo "from django.contrib.auth.models import User; User.objects.create_superuser('admin', 'admin@example.com', 'pass') if not User.objects.filter(username='admin').exists() else print('Admin user already exists.')" | python manage.py shell

# Start the Django app
exec "$@"
