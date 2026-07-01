import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'breathing_bot_project.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
username = 'Moin_Hussain95'  # Change this to whatever username you want
email = 'syedmoinhussain9@gmail.com'  # Change this to your email
password = 'Icecream@9.99'  # Change this to a strong production password

if not User.objects.filter(username=username).exists():
    print(f"Creating superuser for {username}...")
    User.objects.create_superuser(username=username, email=email, password=password)
    print("Superuser created successfully!")
else:
    print(f"Superuser {username} already exists.")