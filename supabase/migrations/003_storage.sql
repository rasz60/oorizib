-- Storage 버킷 생성
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', true)
on conflict do nothing;

-- 정산 증빙 사진 업로드 정책
create policy "인증된 사용자 업로드" on storage.objects
  for insert with check (
    bucket_id = 'proofs' and auth.role() = 'authenticated'
  );

create policy "공개 조회" on storage.objects
  for select using (bucket_id = 'proofs');

create policy "본인 삭제" on storage.objects
  for delete using (
    bucket_id = 'proofs' and auth.uid()::text = (storage.foldername(name))[1]
  );
