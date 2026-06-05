-- ============================================================
-- Step 1: Vault에 암호화 키 저장 (SQL Editor에서 직접 실행)
-- 아래 쿼리의 키 부분을 32글자 문자열로 바꿔서 실행하세요.
-- ============================================================
-- SELECT vault.create_secret('your-32-byte-secret-key-here!!', 'encryption_key');

-- ============================================================
-- Step 2: 암호화/복호화 함수 (Vault에서 키를 읽어옴)
-- ============================================================
create or replace function encrypt_value(plain_text text)
returns text language plpgsql security definer as $$
declare
  enc_key text;
begin
  select decrypted_secret into enc_key
  from vault.decrypted_secrets
  where name = 'encryption_key'
  limit 1;

  if enc_key is null then
    raise exception '암호화 키가 Vault에 없습니다. vault.create_secret()을 먼저 실행하세요.';
  end if;

  return encode(encrypt(plain_text::bytea, enc_key::bytea, 'aes'), 'base64');
end;
$$;

create or replace function decrypt_value(encrypted_text text)
returns text language plpgsql security definer as $$
declare
  enc_key text;
begin
  select decrypted_secret into enc_key
  from vault.decrypted_secrets
  where name = 'encryption_key'
  limit 1;

  if enc_key is null then
    raise exception '암호화 키가 Vault에 없습니다.';
  end if;

  return convert_from(
    decrypt(decode(encrypted_text, 'base64'), enc_key::bytea, 'aes'),
    'UTF8'
  );
end;
$$;
