import os
import sys
import pytest

# Ensure backend package root is on the import path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.main import create_app
from src.config import TestingConfig
from src.models.user import db, User

@pytest.fixture
def app():
    app = create_app()
    app.config.from_object(TestingConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def active_user(app):
    with app.app_context():
        user = User(
            email='test@example.com',
            first_name='Test',
            last_name='User',
            status='active'
        )
        user.set_password('Password1!')
        db.session.add(user)
        db.session.commit()
        return user.email
