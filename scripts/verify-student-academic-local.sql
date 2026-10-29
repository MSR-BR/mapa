-- Local-only behavioral check for C165; no remote data or credentials.
insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-4000-8000-000000000165', 'ana@example.test', '{"full_name":"Ana Inicial"}'),
  ('00000000-0000-4000-8000-000000000166', 'other@example.test', '{}'),
  ('00000000-0000-4000-8000-000000000168', 'advisor@example.test', '{}');

update auth.users set email_confirmed_at = now()
where id = '00000000-0000-4000-8000-000000000168';
insert into auth.identities (user_id, provider, identity_data)
values ('00000000-0000-4000-8000-000000000168', 'google', '{"email":"advisor@example.test"}');

insert into public.user_profiles (user_id, active_role) values
  ('00000000-0000-4000-8000-000000000165', 'student'),
  ('00000000-0000-4000-8000-000000000166', 'student'),
  ('00000000-0000-4000-8000-000000000168', 'advisor');

insert into public.student_academic_profiles
  (user_id, display_name, university, department, course_name, study_levels)
values
  ('00000000-0000-4000-8000-000000000165', 'Ana Silva', 'UFF', 'Instituto de Física', 'Física', array['tcc', 'academic_masters']);

insert into public.projects (id, owner_id, title, authoring_role)
values ('00000000-0000-4000-8000-000000000167', '00000000-0000-4000-8000-000000000165', 'Projeto C165', 'student');

do $$ begin
  if (select student_display_name from public.projects where id = '00000000-0000-4000-8000-000000000167') <> 'Ana Silva' then
    raise exception 'student_name_not_copied';
  end if;
end $$;

update public.student_academic_profiles set display_name = 'Ana Revisada'
where user_id = '00000000-0000-4000-8000-000000000165';

update public.projects set advisor_id = '00000000-0000-4000-8000-000000000168', advisor_email = 'advisor@example.test'
where id = '00000000-0000-4000-8000-000000000167';

do $$ begin
  if (select student_display_name from public.projects where id = '00000000-0000-4000-8000-000000000167') <> 'Ana Revisada' then
    raise exception 'student_name_not_updated';
  end if;
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000166', false);
do $$ begin
  if (select count(*) from public.student_academic_profiles) <> 0 then
    raise exception 'other_student_can_read_profile';
  end if;
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000165', false);
do $$ begin
  if (select count(*) from public.student_academic_profiles where display_name = 'Ana Revisada') <> 1 then
    raise exception 'student_cannot_read_own_profile';
  end if;
  begin
    update public.projects set student_display_name = 'Nome forjado'
    where id = '00000000-0000-4000-8000-000000000167';
    raise exception 'student_can_change_project_name_directly';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000168', false);
do $$ begin
  if (select count(*) from public.projects where id = '00000000-0000-4000-8000-000000000167' and student_display_name = 'Ana Revisada') <> 1 then
    raise exception 'advisor_cannot_read_student_name_on_project';
  end if;
  if (select count(*) from public.student_academic_profiles) <> 0 then
    raise exception 'advisor_can_read_private_academic_profile';
  end if;
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000166', false);
do $$ begin
  update public.student_academic_profiles set display_name = 'Nome forjado'
  where user_id = '00000000-0000-4000-8000-000000000165';
  if found then raise exception 'other_student_can_change_profile'; end if;
  begin
    insert into public.student_academic_profiles
      (user_id, display_name, university, department, course_name, study_levels)
    values ('00000000-0000-4000-8000-000000000165', 'Nome forjado', 'UFF', 'Instituto', 'Física', array['tcc'])
    on conflict (user_id) do update set display_name = excluded.display_name;
    raise exception 'other_student_can_upsert_profile';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
