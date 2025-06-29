from flask import url_for
from src.models.user import db


def test_register_missing_email(client):
    res = client.post('/api/v1/users/auth/register', json={
        'password': 'Password1!',
        'first_name': 'John',
        'last_name': 'Doe'
    })
    assert res.status_code == 400
    assert b'email' in res.data


def test_login_missing_password(client, active_user):
    res = client.post('/api/v1/users/auth/login', json={'email': active_user})
    assert res.status_code == 400


def test_mfa_verify_requires_token(client, active_user):
    login = client.post('/api/v1/users/auth/login', json={'email': active_user, 'password': 'Password1!'})
    token = login.get_json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    res = client.post('/api/v1/security/mfa/verify', headers=headers, json={})
    assert res.status_code == 400
