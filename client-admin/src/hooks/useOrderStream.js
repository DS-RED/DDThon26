import { useEffect, useRef, useState } from 'react';
import { getToken } from '../api/client.js';

const BASE = import.meta.env.VITE_API_BASE || '';
const RECONNECT_MS = 3000;

/**
 * 관리자 실시간 주문 스트림 구독 (P1 SSE 발행 → P4 구독).
 * 계약: GET /api/stores/:storeId/events  (Authorization: Bearer 헤더)
 *
 * 브라우저 표준 EventSource는 커스텀 헤더를 설정할 수 없어 JWT를 URL 쿼리에 실어야 하는데,
 * 쿼리 토큰은 접근 로그·프록시 로그·브라우저 히스토리에 남는다. 이를 피하려고
 * fetch + ReadableStream 으로 SSE를 직접 읽어 토큰을 Authorization 헤더로만 전송한다.
 * (자동 재연결/이벤트 파싱은 여기서 직접 처리.)
 *
 * @param {number|null} storeId
 * @param {(type: string, data: any) => void} onEvent  최신 콜백을 ref로 잡아 재구독을 피한다.
 * @returns {{ connected: boolean }}
 */
export function useOrderStream(storeId, onEvent) {
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const token = getToken();
    if (!storeId || !token) return undefined;

    const controller = new AbortController();
    let stopped = false;
    let reconnectTimer = null;

    const dispatch = (eventType, dataStr) => {
      let data = null;
      try {
        data = dataStr ? JSON.parse(dataStr) : null;
      } catch {
        data = dataStr;
      }
      if (eventType === 'connected') {
        setConnected(true);
        return;
      }
      handlerRef.current?.(eventType, data);
    };

    // SSE 프레임 파싱: 이벤트는 빈 줄(\n\n)로 구분, `event:`/`data:` 라인, `:` 주석(하트비트)은 무시.
    const parseFrame = (frame) => {
      let eventType = 'message';
      const dataLines = [];
      for (const line of frame.split('\n')) {
        if (line.startsWith(':')) continue; // 주석/하트비트
        if (line.startsWith('event:')) eventType = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''));
      }
      if (dataLines.length > 0 || eventType !== 'message') {
        dispatch(eventType, dataLines.join('\n'));
      }
    };

    const connect = async () => {
      try {
        const res = await fetch(`${BASE}/api/stores/${storeId}/events`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          // 401 등: client.js 를 거치지 않으므로 여기서 직접 처리. 재시도는 하되 연결 표시는 끈다.
          setConnected(false);
          scheduleReconnect();
          return;
        }
        setConnected(true);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            parseFrame(frame);
          }
        }
        // 스트림 정상 종료 → 재연결
        setConnected(false);
        scheduleReconnect();
      } catch (err) {
        if (stopped || err?.name === 'AbortError') return; // 정리 중이면 조용히 종료
        setConnected(false);
        scheduleReconnect();
      }
    };

    const scheduleReconnect = () => {
      if (stopped) return;
      reconnectTimer = setTimeout(connect, RECONNECT_MS);
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      controller.abort();
      setConnected(false);
    };
  }, [storeId]);

  return { connected };
}
