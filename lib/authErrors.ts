// Supabase auth 에러 메시지를 사용자용 한국어 문구로 변환한다.
export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (m.includes("email not confirmed"))
    return "이메일 인증이 필요합니다. 받은 메일의 링크를 누른 뒤 다시 로그인해주세요.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "이미 가입된 이메일입니다. 로그인해주세요.";
  if (m.includes("password should be at least"))
    return "비밀번호는 6자 이상이어야 합니다.";
  if (m.includes("unable to validate email") || m.includes("invalid email"))
    return "이메일 형식이 올바르지 않습니다.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
  return message;
}
