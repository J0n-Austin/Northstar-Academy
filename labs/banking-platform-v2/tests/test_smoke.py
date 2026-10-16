from conftest import make_account

def test_health(client):assert client.get('/health').json()=={'status':'ok','version':'v2'}

def test_auth_and_accounts(client,actors):
    alice,bob=actors
    account=make_account(client,alice,'Operations')
    assert client.get('/accounts',headers=alice).json()['accounts'][0]['id']==account
    assert client.get('/accounts',headers=bob).json()['accounts']==[]
    assert client.get('/accounts').status_code==401
    assert client.post('/sessions',json={'username':'alice','password':'wrong-password-123'}).status_code==401

def test_transfer_first_execution(client,actors):
    alice,_=actors;a=make_account(client,alice,'A');b=make_account(client,alice,'B',0)
    payload={'source_id':a,'destination_id':b,'amount_cents':100,'request_key':'once-0001'}
    assert client.post('/transfers',json=payload,headers=alice).status_code==201
    assert [r['balance_cents'] for r in client.get('/accounts',headers=alice).json()['accounts']]==[900,100]
