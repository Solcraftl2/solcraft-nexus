
def test_protected_endpoint_requires_auth(client):
    res = client.get('/api/v1/security/mfa/status')
    assert res.status_code == 401


def test_register_malicious_input(client):
    res = client.post('/api/v1/users/auth/register', json={
        'email': '<script>alert(1)</script>',
        'password': 'Password1!',
        'first_name': 'John',
        'last_name': 'Doe'
    })
    assert res.status_code == 400
