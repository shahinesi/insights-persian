import { describe, expect, it } from 'vitest'
import { calendarSpanFilter, jalaliPeriodRange, resolvePersianSpan } from './calendar'

describe('Jalali filter periods', () => {
	it('resolves a Persian month to canonical Gregorian endpoints', () => {
		expect(jalaliPeriodRange('2026-03-20', 'month')).toEqual(['2026-02-20', '2026-03-20'])
		expect(resolvePersianSpan('last 1 month', '2026-03-20')).toEqual([
			'2026-01-21',
			'2026-02-19',
		])
	})

	it('uses Asia/Tehran when a datetime crosses midnight into Farvardin', () => {
		const instant = new Date('2026-03-20T20:30:00Z')
		expect(jalaliPeriodRange(instant, 'month')).toEqual(['2026-03-21', '2026-04-20'])
		expect(jalaliPeriodRange(instant, 'year')).toEqual(['2026-03-21', '2027-03-20'])
	})

	it('covers the current Jalali quarter and leaves fiscal spans site-defined', () => {
		expect(resolvePersianSpan('current quarter', '2026-03-20')).toEqual([
			'2025-12-22',
			'2026-03-20',
		])
		expect(resolvePersianSpan('fiscal year to date', '2026-03-20')).toBeUndefined()
	})

	it('sends Jalali periods as Gregorian bounds while preserving English span values', () => {
		expect(calendarSpanFilter('current month', 'fa-IR', '2026-03-20')).toEqual({
			operator: 'between',
			value: ['2026-02-20', '2026-03-20'],
		})
		expect(calendarSpanFilter('current month', 'en-US', '2026-03-20')).toEqual({
			operator: 'within',
			value: { span: 'current month' },
		})
	})
})
