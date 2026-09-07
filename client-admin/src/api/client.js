// 백엔드 API 클라이언트 (P4). 계약: docs/contracts/*.md
// 경로는 Vite dev 프록시(/api, /health)를 통해 백엔드로 전달된다.

const BASE = import.meta.env.VITE_API_BASE || '';

const TOKEN_KEY = 'to.admin.token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/** 401 발생 시 앱 전역에 알려 로그아웃을 유도한다. */
export const UNAUTHORIZED_EVENT = 'auth:unauthorized';

/**
 * JSON API 호출 헬퍼.
 * @param {string} path  예: `/api/stores/1/orders`
 * @param {{method?:string, body?:any, auth?:boolean}} [opts]
 */
export async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body != null) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    const err = new Error('백엔드에 연결할 수 없습니다. 서버(localhost:3000)가 실행 중인지 확인하세요.');
    err.cause = networkErr;
    throw err;
  }

  if (res.status === 401) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const message = data?.error?.message || `요청 실패 (HTTP ${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.details = data?.error?.details;
    throw err;
  }
  return data;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
