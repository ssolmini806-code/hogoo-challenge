const ADMIN_MODE_STORAGE_KEY = 'admin_mode';
const ADMIN_TOKEN_PARAM = 'admin_token';
const ADMIN_VERIFY_ENDPOINT = 'https://givecosystem.com/api/admin/verify-token';
const ADMIN_MODE_TTL_MS = 60 * 60 * 1000;

function getStoredAdminMode() {
  const stored = window.localStorage.getItem(ADMIN_MODE_STORAGE_KEY);
  if (!stored) return false;

  if (stored === 'true') {
    storeAdminMode();
    return true;
  }

  try {
    const parsed = JSON.parse(stored);
    if (parsed?.enabled === true && Number(parsed.expiresAt) > Date.now()) {
      return true;
    }
  } catch {}

  window.localStorage.removeItem(ADMIN_MODE_STORAGE_KEY);
  return false;
}

function storeAdminMode() {
  window.localStorage.setItem(ADMIN_MODE_STORAGE_KEY, JSON.stringify({
    enabled: true,
    expiresAt: Date.now() + ADMIN_MODE_TTL_MS,
  }));
}

export function isAdminModeEnabled() {
  if (typeof window === 'undefined') return false;
  return getStoredAdminMode();
}

function removeAdminTokenFromUrl(url) {
  url.searchParams.delete(ADMIN_TOKEN_PARAM);
  window.history.replaceState(null, '', url.toString());
}

export async function initializeAdminModeFromUrl() {
  if (typeof window === 'undefined') return false;

  const url = new URL(window.location.href);
  const token = url.searchParams.get(ADMIN_TOKEN_PARAM);
  if (!token) return isAdminModeEnabled();

  try {
    const verifyUrl = new URL(ADMIN_VERIFY_ENDPOINT);
    verifyUrl.searchParams.set('token', token);

    const response = await fetch(verifyUrl.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const data = await response.json().catch(() => null);

    if (data?.valid === true) {
      storeAdminMode();
    }
  } catch (error) {
    console.warn('Admin token verification failed:', error);
  } finally {
    removeAdminTokenFromUrl(url);
  }

  return isAdminModeEnabled();
}
