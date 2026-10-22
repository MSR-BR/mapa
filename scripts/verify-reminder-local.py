"""Isolated PostgreSQL: grants, authorization, cooldown and real concurrency."""
import concurrent.futures, json, pathlib, subprocess, time
root=pathlib.Path.cwd(); name='mapa-c127-reminders-local'
def run(*args, **kwargs):
    return subprocess.run(args,check=True,text=True,capture_output=True,**kwargs).stdout
def sql(text): return run('docker','exec','-i',name,'psql','-U','postgres','-qAt','-v','ON_ERROR_STOP=1',input=text)
def file(p): return run('docker','exec',name,'psql','-U','postgres','-qAt','-v','ON_ERROR_STOP=1','-f','/workspace/'+p)
if subprocess.run(['docker','container','inspect',name],capture_output=True).returncode==0: raise RuntimeError('Refusing existing container')
try:
    run('docker','run','--detach','--rm','--network','none','--name',name,'--env','POSTGRES_PASSWORD=synthetic_local_only',
        '--volume',str(root/'supabase/migrations')+':/workspace/supabase/migrations:ro',
        '--volume',str(root/'scripts')+':/workspace/scripts:ro',
        '--volume',str(root/'scripts/verify-explicit-grants-stub.sql')+':/docker-entrypoint-initdb.d/000_stub.sql:ro','postgres:17-alpine')
    for _ in range(30):
        if subprocess.run(['docker','exec',name,'pg_isready','-U','postgres'],capture_output=True).returncode==0: break
        time.sleep(1)
    for p in sorted((root/'supabase/migrations').glob('*.sql')):
        if 'account_mode_database_foundation' in p.name: file('scripts/verify-mode-aware-rls-seed.sql')
        if 'c125_workflow_owner_guard' in p.name: file('scripts/verify-reminder-seed.sql')
        file(str(p.relative_to(root)))
    print(file('scripts/verify-reminder-local.sql').strip())
    print(file('scripts/verify-explicit-grants.sql').strip())
    def reserve(n):
        return json.loads(sql("set role authenticated; set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111'; select public.reserve_advisor_reminder('12700000-0000-4000-8000-%012d','current-review');"%n))
    for label,indices,expected in [('same review',[7]*20,1),('distinct projects',list(range(8,28)),5)]:
        sql('truncate private.advisor_reminder_reservations,private.advisor_reminder_actors;')
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool: results=list(pool.map(reserve,indices))
        assert sum(r['allowed'] for r in results)==expected,results
        print(f'PASS: 20 concurrent / {label}: {expected} allowed')
    sql("truncate private.advisor_reminder_reservations,private.advisor_reminder_actors; insert into private.advisor_reminder_actors values('11111111-1111-4111-8111-111111111111',array[now()-interval '25 hours',now()-interval '1 hour',now()-interval '1 hour',now()-interval '1 hour',now()-interval '1 hour']);")
    assert reserve(7)['allowed'] is True
    assert reserve(8)['code']=='reminder_limit'
    print('PASS: rolling 24h window does not reset recent attempts at boundary')
    # No direct table writes or anonymous/service-role RPC execution.
    assert sql("select has_function_privilege('anon','public.reserve_advisor_reminder(uuid,text)','EXECUTE') or has_function_privilege('service_role','public.reserve_advisor_reminder(uuid,text)','EXECUTE');").strip()=='f'
    print('C127 local reminder checks PASS; no email sent')
except subprocess.CalledProcessError as e:
    print(e.stderr); raise
finally:
    subprocess.run(['docker','stop',name],capture_output=True)
