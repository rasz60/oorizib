// 계좌번호, 토큰 등 민감 정보는 Supabase Edge Function에서 pgcrypto로 암호화
// 클라이언트에서는 Supabase RPC를 통해 암복호화 요청

export async function encryptAccountNumber(raw: string): Promise<string> {
  // 실제 암호화는 서버 측 RPC 호출로 처리 (pgcrypto sym_encrypt)
  // 클라이언트에서 직접 암호화 키 노출 금지
  throw new Error(
    "계좌 암호화는 서버 RPC를 통해 처리됩니다. lib/api/openbanking.ts를 사용하세요."
  );
}
