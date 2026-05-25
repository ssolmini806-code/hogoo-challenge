export const SUPPORTED_LOCALES = ['ko', 'en'];
export const DEFAULT_LOCALE = 'ko';
export const LOCALE_STORAGE_KEY = 'give_locale';

export function normalizeLocale(value) {
  const raw = String(value || '').toLowerCase();
  if (raw.startsWith('en')) return 'en';
  if (raw.startsWith('ko')) return 'ko';
  return DEFAULT_LOCALE;
}

export function detectLocale() {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved) return normalizeLocale(saved);
  } catch {}
  if (typeof navigator !== 'undefined') return normalizeLocale(navigator.language);
  return DEFAULT_LOCALE;
}

export function saveLocale(locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, normalizeLocale(locale));
  } catch {}
}

export const commonCopy = {
  ko: {
    reviews: '후기', hallOfFame: '명예의 전당', logout: '로그아웃', loading: '불러오는 중...', adminChecking: '관리자 권한 확인 중...', dashboard: '대시보드', digitalContent: '디지털 콘텐츠', adultOnly: '성인 대상', notCounseling: '전문 상담 아님', notDonation: '기부·후원 아님', support: '고객센터', footerRights: '© 2025 GIVE ID. All rights reserved.',
  },
  en: {
    reviews: 'Reviews', hallOfFame: 'Hall of Fame', logout: 'Log out', loading: 'Loading...', adminChecking: 'Checking admin access...', dashboard: 'Dashboard', digitalContent: 'Digital content', adultOnly: 'Adults only', notCounseling: 'Not counseling', notDonation: 'Not a donation', support: 'Support', footerRights: '© 2025 GIVE ID. All rights reserved.',
  },
};
