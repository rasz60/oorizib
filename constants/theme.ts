// 토스뱅크 스타일 팔레트 (Toss Blue + 뉴트럴 그레이 스케일)
export const Colors = {
  primary: '#3182F6',
  primaryDark: '#1B64DA',
  primaryLight: '#4593FC',
  primaryUltraLight: '#E8F1FD',
  background: '#F2F4F6',
  surface: '#FFFFFF',
  text: '#191F28',
  textSub: '#4E5968',
  textLight: '#8B95A1',
  success: '#15B86A',
  successLight: '#E6F7EF',
  warning: '#FF9500',
  warningLight: '#FFF3E0',
  danger: '#F04452',
  dangerLight: '#FDECEE',
  border: '#E5E8EB',
  yellow: '#FFC845',
  shadow: 'rgba(0, 23, 51, 0.06)',
  widget: '#FFF',
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: Colors.text },
  h2: { fontSize: 22, fontWeight: '700' as const, color: Colors.text },
  h3: { fontSize: 18, fontWeight: '600' as const, color: Colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: Colors.text },
  bodyBold: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  caption: { fontSize: 12, fontWeight: '400' as const, color: Colors.textSub },
  label: { fontSize: 13, fontWeight: '500' as const, color: Colors.textSub },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

// 토스 스타일: 그림자를 거의 쓰지 않고 카드/배경 명도 차로 분리(플랫). 약한 뉴트럴 그림자만 사용.
export const Shadow = {
  card: {
    shadowColor: '#001733',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  widget: {
    shadowColor: '#001733',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sm: {
    shadowColor: '#001733',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
};