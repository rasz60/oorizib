# Oorizib 설정 가이드

## 1. 환경 설정

`.env.example`을 복사하여 `.env.local` 파일을 생성하고 아래 값을 채워넣으세요.

```bash
cp .env.example .env.local
```

---

## 2. 필요한 API 키 및 계정 목록

### ① Supabase (필수)
| 항목 | 위치 | 변수명 |
|------|------|--------|
| Project URL | Supabase Dashboard → Settings → API | `EXPO_PUBLIC_SUPABASE_URL` |
| anon public key | Supabase Dashboard → Settings → API | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| service_role key | Supabase Dashboard → Settings → API | `SUPABASE_SERVICE_ROLE_KEY` |
| 암호화 키 (32바이트) | 직접 생성 후 DB 설정에 추가 | DB Custom Configuration |

> 가입: https://supabase.com

### ② Expo (필수, 푸시 알림)
| 항목 | 위치 | 변수명 |
|------|------|--------|
| Project ID | expo.dev → 프로젝트 생성 후 확인 | `EXPO_PUBLIC_PROJECT_ID` |

> EAS CLI: `npx eas-cli@latest init`

### ③ 오픈뱅킹 API - 금융결제원 (선택, 계좌 연동)
| 항목 | 위치 | 변수명 |
|------|------|--------|
| Client ID | 금융결제원 개발자센터 → 앱 등록 | `OPEN_BANKING_CLIENT_ID` |
| Client Secret | 금융결제원 개발자센터 → 앱 등록 | `OPEN_BANKING_CLIENT_SECRET` |

> 신청: https://openbanking.or.kr
> ⚠️ 사전 심사 필요 (사업자 등록번호 또는 개인 사용 사유서 제출)
> ⚠️ 실제 서비스를 위해서는 운영 환경 신청 필요

### ④ 한국투자증권 (KIS) OpenAPI (선택, 주식 정보)
| 항목 | 위치 | 변수명 |
|------|------|--------|
| App Key | KIS 개발자포털 → 앱 등록 | `KIS_APP_KEY` |
| App Secret | KIS 개발자포털 → 앱 등록 | `KIS_APP_SECRET` |
| 계좌번호 | 한투 증권 계좌 | `KIS_ACCOUNT_NO` |

> 신청: https://apiportal.koreainvestment.com
> ⚠️ 한국투자증권 계좌 필요
> ⚠️ 실전투자 전 모의투자로 먼저 테스트 권장

---

## 3. Supabase 설정

### 3-1. 데이터베이스 마이그레이션
Supabase Dashboard → SQL Editor에서 순서대로 실행:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_encrypt_functions.sql`
3. `supabase/migrations/003_storage.sql`

### 3-2. 암호화 키 설정 (Vault 사용)
Supabase Dashboard → **SQL Editor** 에서 아래 실행 (키는 정확히 32글자):
```sql
SELECT vault.create_secret('your-32-byte-secret-key-here!!', 'encryption_key');
```
적용 확인:
```sql
SELECT name, created_at FROM vault.secrets WHERE name = 'encryption_key';
```

### 3-3. Edge Functions 배포
```bash
npx supabase functions deploy send-notification
npx supabase functions deploy settlement-reminder
npx supabase functions deploy schedule-reminder
```

### 3-4. Cron 스케줄 설정 (외부 크론 서비스 사용 권장)

Supabase Free 플랜에서는 pg_cron 사용이 제한됩니다.
**[cron-job.org](https://cron-job.org)** (무료)를 사용하세요.

#### 설정 방법
1. cron-job.org 가입 후 "Create cronjob" 클릭
2. URL: `https://<project-id>.supabase.co/functions/v1/<function-name>`
3. Headers 추가: `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`

| 함수명 | 크론 표현식 | KST 시간 |
|--------|-------------|----------|
| `settlement-reminder` | `0 1 * * *` (UTC) | 매일 오전 10시 |
| `settlement-reminder` | `0 11 * * *` (UTC) | 매일 오후 8시 |
| `schedule-reminder` | `*/10 * * * *` | 매 10분 |

#### pg_cron을 직접 사용하려면 (Pro 플랜 이상)
Dashboard → Database → Extensions → `pg_cron` Enable 후 `pg_net` Enable, 그 다음 SQL Editor에서:
```sql
select cron.schedule('settlement-reminder-am', '0 1 * * *',
  $$select net.http_post(url:='https://<project>.supabase.co/functions/v1/settlement-reminder',
    headers:='{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb)$$);

select cron.schedule('settlement-reminder-pm', '0 11 * * *',
  $$select net.http_post(url:='https://<project>.supabase.co/functions/v1/settlement-reminder',
    headers:='{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb)$$);

select cron.schedule('schedule-reminder', '*/10 * * * *',
  $$select net.http_post(url:='https://<project>.supabase.co/functions/v1/schedule-reminder',
    headers:='{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb)$$);
```

---

## 4. 패키지 설치 및 실행

```bash
npm install
npx expo start
```

---

## 5. 카카오 위치 기능 관련

카카오톡의 친구 위치 기능은 카카오 API 공개 범위 밖의 기능으로 외부 앱에서 동일하게 구현이 불가능합니다.  
본 앱에서는 **Supabase Realtime + expo-location**을 활용한 자체 위치 공유 기능으로 대체했습니다.  
지도 시각화가 필요한 경우 `react-native-maps`를 추가로 설치하세요:

```bash
npx expo install react-native-maps
```

---

## 6. 프로젝트 구조 요약

```
oorizib/
├── app/                    # Expo Router 화면
│   ├── (auth)/             # 로그인/회원가입
│   ├── (tabs)/             # 탭 메인 화면
│   ├── group/              # 그룹 관리
│   ├── schedule/           # 일정 생성
│   ├── finance/            # 정산
│   ├── utility/            # 언제와/했어/뭐먹지/위치
├── components/             # 재사용 컴포넌트
├── lib/
│   ├── supabase.ts         # Supabase 클라이언트
│   └── api/
│       ├── kis.ts          # 한국투자증권 API
│       └── openbanking.ts  # 오픈뱅킹 API
├── stores/                 # Zustand 상태 관리
├── types/                  # TypeScript 타입
├── constants/              # 앱 상수
├── supabase/
│   ├── migrations/         # DB 스키마
│   └── functions/          # Edge Functions (알림)
```
