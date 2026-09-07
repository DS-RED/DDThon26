// 표시용 포맷 헬퍼.

export function won(amount) {
  const n = Number(amount) || 0;
  return `${n.toLocaleString('ko-KR')}원`;
}

// 백엔드 시간은 UTC 'YYYY-MM-DD HH:MM:SS'. 로컬 시각으로 표시.
export function timeAgoOrClock(sqlUtc) {
  if (!sqlUtc) return '';
  const iso = sqlUtc.includes('T') ? sqlUtc : `${sqlUtc.replace(' ', 'T')}Z`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return sqlUtc;
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export function dateTime(sqlUtc) {
  if (!sqlUtc) return '';
  const iso = sqlUtc.includes('T') ? sqlUtc : `${sqlUtc.replace(' ', 'T')}Z`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return sqlUtc;
  return d.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
}

export const STATUS_LABEL = {
  pending: '대기',
  preparing: '준비중',
  completed: '완료',
};
