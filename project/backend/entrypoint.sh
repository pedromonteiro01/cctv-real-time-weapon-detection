#!/bin/bash

# Wait for the database to be ready
until mysql -h "mysql" -u "user" -p"userpassword" -e "SELECT 1"; do
    >&2 echo "MySQL is unavailable - sleeping"
    sleep 1
done

# Migrate the database
python manage.py migrate

# Start the Django app
exec "$@"
