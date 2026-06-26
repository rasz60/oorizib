# 작업 로그 (TODO / 진행 내역)

> git commit 단위로 작업 내용을 기록합니다. (최신 항목이 위로)

---

## (미커밋) 2026-06-26 — 메인 페이지 디자인 시스템 표준화 + 가계부 위젯 완성

사용자가 도입한 디자인 토큰(`constants/theme.ts`)과 `Card`/`Widget` 공통 컴포넌트 기준으로 메인 페이지를 일원화하고, tobe 4번 가계부 위젯 스펙을 마저 구현.

### 표준화 (`app/(tabs)/index.tsx`)
- NativeWind `className`/`StyleSheet` 혼용 제거 → `theme.ts`(`Colors`/`Radius`/`Typography`) + `StyleSheet` 로 통일(헤더·구성원·일정·가계부·바로가기·바텀시트 전부). 단, 바로가기 아이콘 원형 배경은 동적 tailwind `bg-*` 라 `className` 유지.
- 하드코딩 인디고(`#4f46e5`) → 테마 라벤더(`Colors.primary`).

### 레이아웃 / 버그 수정
- 구성원 위젯을 별도 카드 → 헤더(보라 배경) 내부로 이동, 흰색 20px 겹친 아바타 + 멤버 상세 `BottomSheet` 유지.
- 가계부 "잔고"가 `income` 을 출력하던 버그 → 실제 잔고로 교체.
- 바로가기: 세로로 깨지던 레이아웃 → `flexWrap + gap` 3열 그리드 복원(`Card` 기본 margin 0 오버라이드).

### tobe 4 가계부 위젯 스펙 완성
- 계좌 잔고(full width): `home-balance` 쿼리(그룹 전체 누적 수입-지출) 신규. ※ `bank_accounts` 에 잔고 컬럼이 없어 거래 누적으로 산출(추후 오픈뱅킹 실잔고 연동 여지).
- 수입/지출(1/2씩) + 사용처 도넛(`monthTx` 에 `category` 추가, `EXPENSE_CATEGORIES` 집계 → `PieChart` 도넛 + 범례).

### 공통 컴포넌트 (사용자 추가, 본 커밋에 포함)
- `constants/theme.ts`(디자인 토큰), `components/ui/Card.tsx`, `components/ui/Widget.tsx`.

> 타입 체크 통과(변경 파일 에러 없음).

## 2026-06-05 — `d380329` feat: initial commit - Oorizib React Native (Expo) app

Oorizib React Native(Expo) 앱 초기 커밋. 총 46개 파일.

### 앱 화면 (expo-router)
- 인증: `app/(auth)/login.tsx`, `register.tsx`, `_layout.tsx`
- 탭: `app/(tabs)/index.tsx`, `calendar.tsx`, `finance.tsx`, `invest.tsx`, `utility.tsx`, `wishlist.tsx`, `_layout.tsx`
- 정산: `app/finance/settlement.tsx`
- 그룹: `app/group/create.tsx`, `invite.tsx`, `join.tsx`
- 일정: `app/schedule/create.tsx`
- 유틸리티: `app/utility/did-you-do.tsx`, `location.tsx`, `what-to-eat.tsx`, `when-coming.tsx`
- 루트: `app/_layout.tsx`, `app/global.css`

### 상태 관리 (zustand)
- `stores/authStore.ts`, `groupStore.ts`, `notificationStore.ts`

### 라이브러리 / API
- `lib/supabase.ts`, `lib/api/kis.ts`(한국투자증권), `lib/api/openbanking.ts`(오픈뱅킹), `lib/utils/encryption.ts`

### 백엔드 (Supabase)
- Edge Functions: `schedule-reminder`, `send-notification`, `settlement-reminder`
- Migrations: `001_initial_schema.sql`, `002_encrypt_functions.sql`, `003_storage.sql`

### 타입 / 설정
- `types/database.ts`, `types/index.ts`, `constants/index.ts`
- `app.config.ts`, `babel.config.js`, `tailwind.config.js`, `tsconfig.json`
- `.env.example`, `.gitignore`, `README_SETUP.md`

---

## (미커밋) 2026-06-26 — 빌드 오류 수정

`npx expo start` 번들링 실패 해결. 상세 내용은 [error.md](../error/error.md) 참고.
- NativeWind 4.1.23 고정, expo-device 추가, babel/metro 설정 수정, global.css 경로 이동.

## (미커밋) 2026-06-26 — 웹 번들링 오류 수정

웹(`expo start --web`) 번들/런타임 오류 해결. 상세 내용은 [error.md](../error/error.md) 참고.
- `metro.config.js`: `@opentelemetry/api`를 빈 모듈로 처리(supabase-js 옵셔널 의존성).
- `lib/supabase.ts`: 플랫폼별 auth storage 분기(웹=localStorage, 네이티브=SecureStore).

## (미커밋) 2026-06-26 — linear-gradient 의존성 추가

`react-native-gifted-charts`가 요구하는 `expo-linear-gradient 13.0.2` 설치. 상세 내용은 [error.md](../error/error.md) 참고.

## (미커밋) 2026-06-26 — 회원가입/로그인 동작 수정

웹에서 안내/에러가 안 보이고 회원가입 후 화면에 머무는 문제 해결. 상세 내용은 [error.md](../error/error.md) 참고.
- `lib/authErrors.ts` 신규(에러 메시지 한국어 변환).
- `app/(auth)/login.tsx`, `register.tsx`: `Alert` 제거 → 화면 내 메시지 표시, signUp 세션 분기 처리.

## (미커밋) 2026-06-26 — UI 개선 1차 (tobe.md: 공통 기반 + 핵심 화면)

[tobe.md](../tobe/tobe.md)의 UI/안내 메시지 요구사항을 "공통 기반 + 핵심 화면" 범위로 구현.

### 안내 메시지 창 (tobe 2번) — 전 플랫폼 대응
- `components/ui/FeedbackProvider.tsx` 신규: RN `Alert`가 웹에서 안 되는 문제를 Modal 기반 공통 안내창으로 해결. `useFeedback().show({ type, title, message, confirmText, onConfirm })`. 확인 버튼 → onConfirm(redirect) 지원.
- `app/_layout.tsx`: `FeedbackProvider`로 앱 전체 감쌈.
- 적용: 회원가입 완료 → "가입이 완료되었습니다" 안내 → 확인 → 로그인 이동(`register.tsx`). 그룹 생성/참여 성공·실패 안내(`group/create.tsx`, `join.tsx`).

### 공통 UI 컴포넌트 + Phosphor Icons (tobe 1번)
- `phosphor-react-native 3.0.6` 설치(아이콘).
- `components/ui/Screen.tsx`: SafeArea + 일관된 좌우/상하 패딩 래퍼(전 플랫폼).
- `components/ui/Button.tsx`: 카카오뱅크 스타일 둥근 버튼(primary/secondary/outline, 로딩/아이콘).
- `components/ui/ScreenHeader.tsx`: 공통 뒤로가기+제목 헤더.
- 리디자인: 메인(`(tabs)/index.tsx`, 바로가기 아이콘 그리드/패딩), 탭바 아이콘(`(tabs)/_layout.tsx`), 그룹 화면 3종, 인증 화면 2종.

### 남은 작업 (다음 단계)
- 나머지 세부 화면(calendar/finance/invest/wishlist/utility 하위, schedule, settlement 등) 카카오뱅크 스타일 + Screen/Button/Feedback 적용.
- 기존 화면들의 `implicit any` 타입 경고 정리.

## (미커밋) 2026-06-26 — 그룹 RLS 무한 재귀 수정

`group_members` 정책 자기참조로 인한 무한 재귀 해결. 상세 내용은 [error.md](../error/error.md) 참고.
- `supabase/migrations/004_fix_group_members_recursion.sql` 신규(`is_group_member` SECURITY DEFINER 함수 + 정책 교체).

## (미커밋) 2026-06-26 — 초대 코드 참여 RPC 방식 구현

비멤버가 초대 코드로 그룹에 참여하도록 RPC 도입. 상세 내용은 [error.md](../error/error.md) 참고.
- `supabase/migrations/005_join_group_rpc.sql` 신규(`join_group_by_code` SECURITY DEFINER 함수).
- `stores/groupStore.ts`: `joinGroup`을 RPC 호출로 변경.

## (미커밋) 2026-06-26 — 그룹 생성 RPC 방식 구현

`groups` 직접 INSERT 시 RLS 위반 해결. 상세 내용은 [error.md](../error/error.md) 참고.
- `supabase/migrations/006_create_group_rpc.sql` 신규(`create_group` SECURITY DEFINER 함수, 생성+owner 등록 원자 처리).
- `stores/groupStore.ts`: `createGroup`을 RPC 호출로 변경.

> ✅ 004/005/006 Supabase 적용·검증 완료(2026-06-26) — 그룹 생성/참여 정상 동작 확인.

## (미커밋) 2026-06-26 — tobe 3·4 구현 (하단 탭 + 메인 위젯)

[tobe.md](../tobe/tobe.md) 3·4번 구현. 웹 export 검증(exit 0).
- 탭 3번: `(tabs)/_layout.tsx` 5탭 재구성(홈 아이콘만, 위시·재테크 `href:null`), `(tabs)/more.tsx`(전체보기) 신규.
- 위젯 4번: `(tabs)/index.tsx` — 그룹 토글 BottomSheet, 가족 멤버 위젯(겹친 아바타 최대 3 + 상세 BottomSheet), 오늘 일정/이번달 가계부 위젯, 바로가기에서 일정·가계부 제외.
- `components/ui/BottomSheet.tsx` 신규(공통 하단 모달).
- 참고: push 는 인증 토큰 문제(rasz60 만료, dzznzz 권한 없음)로 보류 — 사용자 재인증 후 `git push` 필요.
