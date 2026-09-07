import { expect, it } from 'vitest';
import { money, utcDate, orderTime } from '../src/utils/format.js';
it('formats integer KRW', () => expect(money(12500)).toBe('12,500원'));
it('interprets SQLite timestamps explicitly as UTC', () => expect(utcDate('2026-09-07 05:00:00').toISOString()).toBe('2026-09-07T05:00:00.000Z'));
it('handles invalid timestamps', () => expect(orderTime('invalid')).toBe('시간 확인 중'));
