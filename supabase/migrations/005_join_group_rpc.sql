-- ============================================================
-- 초대 코드로 그룹 참여 RPC
-- ============================================================
-- 문제: joinGroup 은 아직 멤버가 아닌 사용자가 invite_code 로 groups 를 조회하는데,
--       groups SELECT 정책(is_group_member)상 비멤버는 읽지 못해 참여가 불가능하다.
--
-- 해결: SECURITY DEFINER 함수로 코드 조회 + 멤버 등록을 한 번에 처리한다.
--       함수는 소유자 권한으로 실행되므로 비멤버도 코드로 가입할 수 있고,
--       groups 전체를 외부에 노출하지 않는다(코드를 정확히 알아야만 가입 가능).
-- ============================================================

create or replace function public.join_group_by_code(_invite_code text)
returns groups
language plpgsql
security definer
set search_path = public
as $$
declare
  g groups;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select * into g from groups where invite_code = upper(_invite_code);

  if g.id is null then
    raise exception 'INVALID_CODE';
  end if;

  insert into group_members (group_id, user_id, role)
  values (g.id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  return g;
end;
$$;

-- 인증된 사용자만 호출 가능하도록 권한 부여
revoke all on function public.join_group_by_code(text) from public;
grant execute on function public.join_group_by_code(text) to authenticated;
