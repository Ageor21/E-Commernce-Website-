from werkzeug.security import generate_password_hash

from app import app
from extensions import db
from models import User


with app.app_context():
    existing_admin = User.query.filter_by(email="admin@example.com").first()

    if existing_admin:
        print("Admin user already exists.")
    else:
        admin_user = User(
            name="Admin",
            email="admin@example.com",
            password=generate_password_hash("adminpassword", method="pbkdf2:sha256"),
            is_admin=True
        )

        db.session.add(admin_user)
        db.session.commit()

        print("Admin user created successfully!")