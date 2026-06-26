-- ============================================================
-- 그룹 생성 RPC
-- ============================================================
-- 문제: groups 에 직접 INSERT + RETURNING(.select()) 시 RLS 에 막혀
--       "new row violates row-level security policy for table groups" 발생.
--       (생성 직후엔 아직 owner 가 group_members 에 없어 SELECT 정책을 통과 못함)
--
-- 해결: SECURITY DEFINER 함수로 그룹 생성 + owner 멤버 등록을 원자적으로 처리한다.
--       함수는 소유자 권한으로 실행되어 RLS 가 적용되지 않으므로 RETURNING 도 안전하다.
-- ============================================================

create or replace function public.create_group(_name text, _description text)
returns groups
language plpgsql
security definer
set search_path = public
as $$
declare
  g groups;
  code text;
  tries int := 0;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- 고유한 6자리 초대 코드 생성
  loop
    code := upper(substr(md5(random()::text), 1, 6));
    exit when not exists (select 1 from groups where invite_code = code);
    tries := tries + 1;
    if tries > 10 then
      raise exception 'CODE_GEN_FAILED';
    end if;
  end loop;

  insert into groups (name, description, invite_code, owner_id)
  values (_name, nullif(_description, ''), code, auth.uid())
  returning * into g;

  insert into group_members (group_id, user_id, role)
  values (g.id, auth.uid(), 'owner');

  return g;
end;
$$;

revoke all on function public.create_group(text, text) from public;
grant execute on function public.create_group(text, text) to authenticated;
