export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.name = 'ApiError'; this.status = status; }
}
const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function request(path, { method = 'GET', body, token, signal, timeout = 12000, expectedStatus } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, timeout);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method, signal: controller.signal,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(response.status === 401 ? '로그인 정보를 다시 확인해 주세요.' : response.status >= 500 ? '서버 응답을 확인하지 못했습니다.' : '요청을 처리하지 못했습니다. 입력 내용과 메뉴 상태를 확인해 주세요.', response.status);
    if (expectedStatus && response.status !== expectedStatus) throw new ApiError('응답을 확인하지 못했습니다.');
    if (data === null) throw new ApiError('응답을 확인하지 못했습니다.');
    return data;
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (error instanceof ApiError) throw error;
    throw new ApiError('연결이 원활하지 않습니다. 잠시 후 다시 확인해 주세요.');
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}
