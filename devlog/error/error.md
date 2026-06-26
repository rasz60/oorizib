# 빌드 / 실행 오류 로그

> 발생한 오류와 해결 과정을 시간순으로 기록합니다. (최신 항목이 위로)

---

## 2026-06-26 — 그룹 생성 시 groups RLS INSERT 위반

### 증상
```
new row violates row-level security policy for table "groups"
```
- 004/005 적용 후에도 그룹 만들기 실패.

### 원인
- `groups` 에 직접 INSERT + `.select()`(RETURNING) 하는데, 생성 직후엔 owner 가 아직 `group_members` 에 없어 SELECT 정책(`is_group_member`)을 통과하지 못해 RETURNING 단계에서 RLS 위반.

### 해결 (RPC 방식, create 도 RPC 로 통일)
- `supabase/migrations/006_create_group_rpc.sql`: `create_group(_name, _description)` **SECURITY DEFINER** 함수. 그룹 생성 + owner 멤버 등록을 원자적으로 처리(코드도 서버에서 생성, `authenticated` 만 execute).
- `stores/groupStore.ts`: `createGroup` 을 `supabase.rpc("create_group", ...)` 호출로 변경(클라이언트 invite_code 생성 제거).
- ✅ 적용·검증 완료(2026-06-26): 004/005/006 Supabase 적용 후 그룹 생성/참여 정상 동작 확인.

---

## 2026-06-26 — 그룹 생성 시 RLS 무한 재귀

### 증상
```
infinite recursion detected in policy for relation "group_members"
```
- 그룹 만들기 → 생성 직후 `fetchGroups`가 `group_members`를 조회할 때 발생.

### 원인
- `group_members`의 "멤버 조회" SELECT 정책이 서브쿼리로 다시 `group_members`를 조회 → RLS 평가가 무한 재귀(Supabase RLS 대표적 함정). `groups`의 "그룹 멤버 조회" 정책도 이를 트리거.

### 해결
- `supabase/migrations/004_fix_group_members_recursion.sql` 신규.
  - `is_group_member(_group_id)` **SECURITY DEFINER** 함수 추가(소유자 권한 실행 → 내부 조회에 RLS 미적용 → 재귀 차단).
  - `group_members`/`groups` 의 SELECT 정책을 자기참조 서브쿼리 → 함수 호출로 교체.
- ✅ 적용·검증 완료(2026-06-26).

### 후속 — 초대 코드 참여 RPC (처리 완료)
- `joinGroup`이 비멤버 상태에서 `groups`를 invite_code 로 직접 조회하던 문제를 RPC 방식으로 해결.
- `supabase/migrations/005_join_group_rpc.sql`: `join_group_by_code(_invite_code)` **SECURITY DEFINER** 함수(코드 조회+멤버 등록을 한 번에, `authenticated`에게만 execute 권한). 그룹 전체를 노출하지 않음.
- `stores/groupStore.ts`: `joinGroup`을 `supabase.rpc("join_group_by_code", ...)` 호출로 변경.
- ✅ 적용·검증 완료(2026-06-26).

---

## 2026-06-26 — 회원가입/로그인 동작 안 함 (웹)

### 증상
- 회원가입해도 성공/실패 안내가 전혀 없고 회원가입 페이지에 그대로 머묾.
- 가입은 됐는데 로그인이 안 됨.

### 원인
1. **웹(react-native-web)에서 `Alert.alert`의 버튼 콜백(`onPress`)이 실행되지 않음.**
   - `register.tsx`가 성공 시 `Alert.alert(..., [{ onPress: () => router.back() }])`로 안내+이동을 처리 → 웹에서 Alert 미동작 → 안내도, 화면 이동도 안 됨.
   - `login.tsx`의 로그인 실패 에러도 `Alert`라 웹에서 안 보임 → 실패 원인 파악 불가.
2. **Supabase 이메일 인증(Confirm email) 활성화.**
   - 인증 메일 링크 클릭 전에는 `signInWithPassword`가 `Email not confirmed` 에러 → 로그인 불가.

### 해결 (코드)
- `lib/authErrors.ts` 신규: Supabase auth 에러 메시지를 한국어로 변환.
- `app/(auth)/login.tsx`: `Alert` 제거, 에러를 화면 내 빨간 배너로 표시. 성공 시 `onAuthStateChange`→`(auth)/_layout`이 `(tabs)`로 이동.
- `app/(auth)/register.tsx`: `Alert` 제거, 화면 내 에러/성공 메시지 표시. `signUp` 응답 분기:
  - `data.session` 존재 → 이메일 인증 OFF, 즉시 로그인되어 자동 이동.
  - `data.user.identities.length === 0` → 이미 가입된 이메일 안내.
  - 그 외 → "인증 메일 발송" 안내 + "로그인하러 가기" 버튼.

### 사용자/설정 측 조치 (대시보드)
- 인증 메일의 링크를 누른 뒤 로그인하거나,
- 개발 편의를 위해 Supabase Dashboard → Authentication → Providers → Email → **Confirm email 토글 OFF** 시 가입 즉시 로그인 가능.

### 비고
- 기존 화면들(finance/invest/calendar/wishlist 등)의 `implicit any` 타입 경고는 번들링/실행과 무관(별도 정리 대상).

---

## 2026-06-26 — `Gradient package was not found` (react-native-gifted-charts)

### 증상
```
Metro error: Gradient package was not found. Make sure
"react-native-linear-gradient" or "expo-linear-gradient" is installed
  at react-native-gifted-charts/dist/Components/common/LinearGradient.js
```
- 차트 라이브러리 `react-native-gifted-charts`가 그라데이션 렌더링에 linear-gradient 패키지를 peer로 요구하나 미설치.

### 해결
- `npx expo install expo-linear-gradient` → **expo-linear-gradient 13.0.2** (SDK 51 호환) 설치.

### 검증
- `npx expo export --platform web` → **exit 0**, 2052개 모듈 번들 성공, gradient 에러 없음.

---

## 2026-06-26 — 웹(`expo start --web`) 번들링 실패

### 증상 1 — 번들 실패
```
Web Bundling failed: Unable to resolve module @opentelemetry/api
from node_modules/@supabase/supabase-js/dist/index.mjs
```
- `package.json`의 `"@supabase/supabase-js": "^2.45.0"` 범위로 **2.108.2**가 설치됨.
- supabase-js가 `@opentelemetry/api`를 옵셔널 동적 import 하는데, Metro가 정적 해석을 시도하다 실패. (해당 패키지는 미설치이며 사용하지도 않음.)

**해결:** `metro.config.js`의 `resolver.resolveRequest`에서 `@opentelemetry/api`를 `{ type: "empty" }`(빈 모듈)로 처리.

### 증상 2 — 런타임 오류
```
TypeError: _ExpoSecureStore.default.getValueWithKeyAsync is not a function
  at Object.getItemAsync (expo-secure-store/build/SecureStore.js)
  at Object.getItem (lib/supabase.ts)
```
- `expo-secure-store`는 **네이티브 전용**인데 `lib/supabase.ts`가 플랫폼 구분 없이 SecureStore를 auth storage로 사용 → 웹에서 메서드 부재로 실패.

**해결:** `lib/supabase.ts`에서 `Platform.OS === "web"`이면 `storage`를 `undefined`로 두어 supabase-js 기본 `localStorage`를 사용하고, 네이티브에서만 SecureStore 어댑터 사용.

### 검증
- `npx expo export --platform web` → **exit 0**, 2049개 모듈 번들 성공.

### 참고 (경고, 조치 불필요)
- `Require cycle: @supabase/auth-js/.../webauthn.js` 순환 참조 경고는 supabase 내부 경고로 동작에 영향 없음.

---

## 2026-06-26 — `npx expo start` 번들링 실패

### 증상
- `npx expo start` 실행 시 비대화형 환경에서 포트 충돌로 종료됨
  (`Input is required, but 'npx expo' is in non-interactive mode` / `Port 8081 is being used`).
- 포트를 우회해도 번들링 단계에서 실패.

### 실제 원인 (핵심 에러)
```
[BABEL] expo-router/entry.js: Cannot find module 'react-native-worklets/plugin'
```
- `package.json`의 `"nativewind": "^4.0.1"` 범위 지정으로 `npm install`이 **nativewind 4.2.6**까지 설치.
- nativewind 4.2.6 → **react-native-css-interop 0.2.6** 의존.
- 해당 버전의 babel preset이 `react-native-worklets/plugin`(**Reanimated 4 이상**용)을 강제 요구.
- 그러나 본 프로젝트는 **Expo SDK 51 / Reanimated 3.10.1** → `react-native-worklets` 미설치 → 모든 파일 변환 실패.

### 부수적으로 발견된 설정 오류
1. `metro.config.js` 자체가 없음 → NativeWind v4는 `withNativeWind`로 CSS 처리 필요.
2. `babel.config.js`에서 `nativewind/babel`이 `plugins`에 위치 → v4에서는 `presets`여야 함.
3. `app/_layout.tsx`의 `import "../global.css"`가 루트 `global.css`를 가리키나 파일은 `app/global.css`에 존재 → 경로 불일치.
4. `stores/notificationStore.ts`가 `expo-device`를 import하나 미설치.

### 해결
| 파일 | 조치 |
|------|------|
| `package.json` | `nativewind` → **4.1.23** 고정 (css-interop 0.1.22 → `react-native-reanimated/plugin` 사용, SDK 51 호환) |
| `package.json` | **expo-device 6.0.2** 추가 (`npx expo install expo-device`) |
| `babel.config.js` | `nativewind/babel`을 `plugins` → `presets`로 이동 |
| `metro.config.js` | 신규 생성 — `withNativeWind(config, { input: "./global.css" })` |
| `global.css` | `app/global.css` → 프로젝트 루트로 이동 |

### 검증
- `npx expo export --platform android` → **exit 0**, 2538개 모듈 번들 성공.
- 실행: `npx expo start -c` (설정 변경 후 캐시 클리어 권장).

### 참고
- 추후 Expo SDK 53+(Reanimated 4)로 올릴 경우 NativeWind 4.2.x로 복귀 + `react-native-worklets` 설치 필요.
