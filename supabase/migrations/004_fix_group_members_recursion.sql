-- ============================================================
-- group_members RLS 무한 재귀 수정
-- ============================================================
-- 문제: "멤버 조회" 정책이 group_members 안에서 다시 group_members 를
--       조회(서브쿼리)하여 RLS 평가가 무한 재귀에 빠진다.
--       → "infinite recursion detected in policy for relation group_members"
--
-- 해결: SECURITY DEFINER 함수로 멤버 여부를 확인한다. 이 함수는 소유자 권한으로
--       실행되어 내부의 group_members 조회에 RLS 가 재적용되지 않으므로 재귀가 끊긴다.
-- ============================================================

create or replace function public.is_group_member(_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from group_members
    where group_id = _group_id
      and user_id = auth.uid()
  );
$$;

-- group_members: 자기 참조 서브쿼리를 함수 호출로 교체
drop policy if exists "멤버 조회" on group_members;
create policy "멤버 조회" on group_members for select
  using (user_id = auth.uid() or public.is_group_member(group_id));

-- groups: 동일 함수로 통일 (기존 서브쿼리도 group_members 정책을 트리거하므로 함께 교체)
drop policy if exists "그룹 멤버 조회" on groups;
create policy "그룹 멤버 조회" on groups for select
  using (public.is_group_member(id));
