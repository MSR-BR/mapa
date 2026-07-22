create schema auth;
create table auth.users (
  id uuid primary key
);

create function auth.uid()
returns uuid
language sql
stable
as $$ select null::uuid $$;

create role anon nologin;
create role authenticated nologin;
