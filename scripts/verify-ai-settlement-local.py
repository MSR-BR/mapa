"""C129: disposable offline PostgreSQL; no provider/network/remote credentials."""
import concurrent.futures, json, pathlib, subprocess, time, uuid
root=pathlib.Path.cwd(); name='mapa-c129-settlement-local'
secret='c129-synthetic-secret-at-least-32-characters'; owner='11111111-1111-4111-8111-111111111111'; other='22222222-2222-4222-8222-222222222222'
def run(*args,**kwargs): return subprocess.run(args,check=True,text=True,capture_output=True,**kwargs).stdout
def sql(q): return run('docker','exec','-i',name,'psql','-U','postgres','-qAt','-v','ON_ERROR_STOP=1',input=q).strip()
def query(q,user=owner): return sql(f"set role authenticated; set request.jwt.claim.sub='{user}'; "+q)
def reserve(id,amount=250,user=owner,key=secret): return json.loads(query(f"select public.reserve_ai_budget_v2('{key}','{id}',{amount},'gemini','gemini-3.6-flash','generate_general_objective');",user))
def settle(id,amount=50,user=owner,key=secret): return query(f"select public.settle_ai_budget('{key}','{id}',{amount},100,50);",user)=='t'
def reset(limit=1000):
    sql(f"truncate private.ai_budget_reservations,private.ai_budget_months; update private.ai_budget_config set monthly_limit_micros={limit};")
def exposure(): return int(sql('select coalesce(sum(reserved_micros),0) from private.ai_budget_months;'))
if subprocess.run(['docker','container','inspect',name],capture_output=True).returncode==0: raise RuntimeError('Existing container: refusing reuse')
try:
    run('docker','run','--detach','--rm','--network','none','--name',name,'--env','POSTGRES_PASSWORD=synthetic_local_only',
        '--volume',str(root/'supabase/migrations')+':/workspace/migrations:ro',
        '--volume',str(root/'scripts/verify-explicit-grants-stub.sql')+':/docker-entrypoint-initdb.d/000_stub.sql:ro','postgres:17-alpine')
    for _ in range(30):
        if subprocess.run(['docker','exec',name,'pg_isready','-U','postgres'],capture_output=True).returncode==0: break
        time.sleep(1)
    sql('create schema private; grant usage on schema private to authenticated;')
    for filename in ['20261006214054_c112_ai_budget.sql','20261023165336_c129_ai_budget_settlement.sql']:
        run('docker','exec',name,'psql','-U','postgres','-qAt','-v','ON_ERROR_STOP=1','-f','/workspace/migrations/'+filename)
    sql(f"insert into private.ai_budget_config values(true,encode(sha256(convert_to('{secret}','UTF8')),'hex'),1000);")
    id=str(uuid.uuid4()); assert reserve(id)['allowed']; assert exposure()==250
    assert not reserve(id)['allowed']; assert exposure()==250
    assert not settle(id,user=other); assert not settle(id,key='wrong-secret-at-least-32-characters'); assert exposure()==250
    assert settle(id); assert exposure()==50; assert settle(id); assert exposure()==50
    assert not settle(id,51); assert not reserve(id)['allowed']; assert exposure()==50
    print('PASS reserve idempotency, owner/secret isolation and exact-once settlement')
    assert not reserve(str(uuid.uuid4()),user='')['allowed']
    for amount in [-1,0,250001]: assert not reserve(str(uuid.uuid4()),amount)['allowed']
    for signature in ['reserve_ai_budget_v2(text,uuid,integer,text,text,text)','settle_ai_budget(text,uuid,bigint,bigint,bigint)']:
        for schema in ['public','private']:
            assert sql(f"select has_function_privilege('anon','{schema}.{signature}','EXECUTE') or has_function_privilege('service_role','{schema}.{signature}','EXECUTE');")=='f'
    assert sql("select has_table_privilege('authenticated','private.ai_budget_reservations','SELECT,INSERT,UPDATE,DELETE');")=='f'
    print('PASS no anonymous/service-role RPC, no direct API table access, invalid inputs denied')
    reset(); ids=[str(uuid.uuid4()) for _ in range(50)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool: admissions=list(pool.map(reserve,ids))
    accepted=[id for id,r in zip(ids,admissions) if r['allowed']]
    assert len(accepted)==4 and exposure()==1000
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool: outcomes=list(pool.map(settle,[accepted[0]]*50))
    assert all(outcomes) and exposure()==800
    print('PASS 50 concurrent admissions: exactly 4 allowed; 50 settlements: one refund')
    # New admissions competing with repeated settlement cannot overshoot or double release.
    reset(); id=str(uuid.uuid4()); assert reserve(id,1000)['allowed']
    jobs=[lambda: settle(id)]*25+[lambda: reserve(str(uuid.uuid4()),100)]*25
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool: list(pool.map(lambda fn:fn(),jobs))
    assert 50<=exposure()<=1000
    assert int(sql('select sum(coalesce(actual_micros,reserved_micros)) from private.ai_budget_reservations;'))==exposure()
    print('PASS mixed concurrent settlement/admission: ledger equals committed exposure')
    reset(); pressure=[]
    for _ in range(10): pressure.append(reserve(str(uuid.uuid4()),100).get('pressure'))
    assert pressure==[None]*7+['80',None,'95']
    # A 100-micro jump crosses 95% only at 100%, but that request is still
    # admitted at the exact limit and must surface the 95% threshold.
    assert pressure[7]=='80' and pressure[9]=='95'
    print('PASS one early warning at 80% and one at 95%, without identity/content')
    reset(); id=str(uuid.uuid4()); assert reserve(id,500)['allowed']; assert settle(id,1200); assert exposure()==1200
    assert not reserve(str(uuid.uuid4()),1)['allowed']
    print('PASS unexpected actual overrun recorded, future admissions fail closed')
    reset(); id=str(uuid.uuid4()); assert reserve(id)['allowed']
    sql("insert into private.ai_budget_months(period,reserved_micros,attempts) values('2001-01-01',250,1); update private.ai_budget_reservations set period='2001-01-01'; delete from private.ai_budget_months where period<>'2001-01-01';")
    assert settle(id); assert sql("select reserved_micros from private.ai_budget_months where period='2001-01-01';")=='50'
    print('PASS settlement updates original period, not current month')
    reset(5000000); assert query(f"select public.reserve_ai_budget('{secret}',1000);")=='t'
    id=str(uuid.uuid4()); assert reserve(id)['allowed']; assert settle(id); assert exposure()==1050
    assert sql('select attempts from private.ai_budget_months;')=='2'
    print('PASS legacy accounting coexists; historical amounts never refunded')
    # Exact C130 approved configuration script, including repeated application.
    update=(root/'.specs/changes/130-fifty-maps-daily-capacity/budget-update.sql').read_text()
    sql(update); sql(update); assert sql('select monthly_limit_micros from private.ai_budget_config;')=='100000000'; assert exposure()==1050
    sql('update private.ai_budget_config set monthly_limit_micros=20000000;')
    try: sql(update); raise AssertionError('unexpected configuration overwritten')
    except subprocess.CalledProcessError: pass
    assert sql('select monthly_limit_micros from private.ai_budget_config;')=='20000000'
    print('PASS C130 compare-and-set, idempotent update, consumption preserved')
    print('C129/C130 POSTGRESQL LOCAL PASS; no paid calls or remote DB used')
except subprocess.CalledProcessError as e:
    print(e.stderr); raise
finally:
    subprocess.run(['docker','stop',name],capture_output=True)
