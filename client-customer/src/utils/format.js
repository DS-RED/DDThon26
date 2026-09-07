export const money = (amount) => `${new Intl.NumberFormat('ko-KR').format(amount)}원`;
export function utcDate(value) {
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? `${value.replace(' ', 'T')}Z` : value;
  return new Date(normalized);
}
export function orderTime(value) {
  const date = utcDate(value);
  return Number.isNaN(date.getTime()) ? '시간 확인 중' : new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}
export const orderStatus = { pending: '대기중', preparing: '준비중', completed: '완료' };
