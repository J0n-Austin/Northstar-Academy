from conftest import make_account

def test_cross_customer_get_is_denied(client,actors):
    alice,bob=actors;account=make_account(client,alice,'Private')
    assert client.get(f'/accounts/{account}',headers=bob).status_code in (403,404)

def test_transfer_retry_has_no_second_effect(client,actors):
    alice,_=actors;a=make_account(client,alice,'A');b=make_account(client,alice,'B',0)
    payload={'source_id':a,'destination_id':b,'amount_cents':200,'request_key':'repeat-00000001'}
    one=client.post('/transfers',json=payload,headers=alice);two=client.post('/transfers',json=payload,headers=alice)
    assert one.status_code==201
    assert two.status_code==200 and two.json()['replayed'] is True
    assert [x['balance_cents'] for x in client.get('/accounts',headers=alice).json()['accounts']]==[800,200]

def test_duplicate_key_changed_payload_rejected_without_money_moving(client,actors):
    alice,_=actors;a=make_account(client,alice,'A');b=make_account(client,alice,'B',0)
    payload={'source_id':a,'destination_id':b,'amount_cents':100,'request_key':'same-key-0001'}
    assert client.post('/transfers',json=payload,headers=alice).status_code==201
    assert client.post('/transfers',json={**payload,'amount_cents':200},headers=alice).status_code==409
    assert [x['balance_cents'] for x in client.get('/accounts',headers=alice).json()['accounts']]==[900,100]

def test_statement_is_scoped_and_stable(client,actors):
    alice,bob=actors;account=make_account(client,alice,'Owner only')
    ok=client.get(f'/statements/{account}',headers=alice)
    assert ok.status_code==200
    assert isinstance(ok.json()['entries'],list)
    assert client.get(f'/statements/{account}',headers=bob).status_code in (403,404)

def test_audit_event_is_minimal_and_recorded(client,actors):
    alice,_=actors;make_account(client,alice,'Eventful')
    response=client.get('/audit',headers=alice);assert response.status_code==200
    events=response.json()['events'];assert len(events)>=1
    for event in events:
        assert set(event)<= {'operation','outcome'}
