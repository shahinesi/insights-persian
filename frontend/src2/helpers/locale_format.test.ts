import { describe, expect, it } from 'vitest'
import {
	formatLocaleDate,
	formatLocaleDateRange,
	formatLocaleNumber,
	formatLocaleRelativeTime,
	parseLocaleNumber,
	directionForLocale,
} from './locale_format'

describe('locale display formatting', () => {
	// @feature charts.x-axis
	it('uses the Jalali calendar and Persian digits for Persian dates', () => {
		expect(
			formatLocaleDate('2025-03-20', 'fa-IR', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
			}),
		).toContain('۱۴۰۳/۱۲/۳۰')
	})

	// @feature charts.x-axis
	it('preserves Gregorian dates and Latin digits in English', () => {
		expect(
			formatLocaleDate('2025-03-20', 'en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			}),
		).toBe('Mar 20, 2025')
		expect(formatLocaleNumber(1250, 'en-US')).toBe('1,250')
	})

	// @feature query.filter-date-on-datetime
	it('keeps date-only values stable and formats instants in the requested timezone', () => {
		expect(
			formatLocaleDate('2026-03-21', 'fa-IR', {
				year: 'numeric', month: '2-digit', day: '2-digit',
			}),
		).toContain('۱۴۰۵/۰۱/۰۱')
		expect(
			formatLocaleDate('2026-03-20T20:30:00Z', 'fa-IR', {
				year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Tehran',
			}),
		).toContain('۱۴۰۵/۰۱/۰۱')
	})

	// @feature charts.x-axis
	it('renders Gregorian bucket endpoints as a Jalali span', () => {
		expect(
			formatLocaleDateRange('2026-03-01', '2026-03-31', 'fa-IR', {
				year: 'numeric', month: 'short', day: 'numeric',
			}),
		).toContain('۱۴۰۴')
	})

	// @feature query.filter-number-range
	it('formats numbers in the selected locale', () => {
		expect(formatLocaleNumber(1250, 'fa-IR')).toBe('۱٬۲۵۰')
		expect(formatLocaleNumber(0.75, 'fa-IR', { style: 'percent' })).toContain('۷۵')
		expect(formatLocaleNumber(Number.NaN, 'fa-IR')).not.toBe('NaN')
		expect(formatLocaleNumber(Number.NaN, 'en-US')).toBe('NaN')
		expect(parseLocaleNumber('۱٬۲۵۰٫۵')).toBe(1250.5)
		expect(parseLocaleNumber('١٢٥٠٫٥')).toBe(1250.5)
	})

	// @feature query.filter-date-on-datetime
	it('returns no display value for impossible dates', () => {
		expect(formatLocaleDate('2026-02-30', 'fa-IR')).toBe('')
	})

	it('formats relative time in Persian digits and preserves English phrasing', () => {
		const now = new Date('2026-10-26T12:00:00Z')
		const past = '2026-10-26T10:00:00Z'
		const persian = formatLocaleRelativeTime(past, 'fa-IR', now)
		expect(persian).toMatch(/[۰-۹]/)
		expect(persian).toContain('پیش')
		expect(formatLocaleRelativeTime(past, 'en-US', now)).toBe('2 hours ago')
		expect(formatLocaleRelativeTime('invalid', 'fa-IR', now)).toBe('')
	})

	// @feature charts.x-axis
	it('sets the document direction from the locale without changing English', () => {
		expect(directionForLocale('fa-IR')).toBe('rtl')
		expect(directionForLocale('ar')).toBe('rtl')
		expect(directionForLocale('en-US')).toBe('ltr')
	})
})
