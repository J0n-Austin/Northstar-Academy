import pytest
from fastapi.testclient import TestClient
from service.api import create_app

@pytest.fixture()
def client(tmp_path):
    app=create_app('sqlite:///'+str(tmp_path/'banking.sqlite3'))
    with TestClient(app) as c:yield c
    app.state.engine.dispose()

@pytest.fixture()
def actors(client):
    def create(name):
        password='Local-Workshop-2026!'
        assert client.post('/users',json={'username':name,'password':password}).status_code==201
        r=client.post('/sessions',json={'username':name,'password':password});assert r.status_code==200
        return {'Authorization':'Bearer '+r.json()['access_token']}
    return create('alice'),create('bob')

def make_account(client,headers,name,cents=1000):
    r=client.post('/accounts',json={'label':name,'opening_cents':cents},headers=headers)
    assert r.status_code==201,r.text
    return r.json()['id']
