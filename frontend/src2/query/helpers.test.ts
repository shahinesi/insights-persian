import { afterEach, describe, expect, it } from 'vitest'
import session from '../session'
import { getAxisDate, getFormattedDate } from './helpers'

const initialLocale = session.user.locale
const initialFiscalYearStart = session.site.fiscal_year_start

afterEach(() => {
	session.user.locale = initialLocale
	session.site.fiscal_year_start = initialFiscalYearStart
})

describe('localized chart date labels', () => {
	// @feature charts.x-axis
	it('labels Gregorian month buckets with their Jalali date span in Persian', () => {
		session.user.locale = 'fa-IR'
		expect(getAxisDate('2026-03-01', 'month')).toContain('1404')
		expect(getFormattedDate('2026-03-01', 'month')).toContain('1405')
	})

	// @feature charts.x-axis
	it('keeps the Gregorian month label in English', () => {
		session.user.locale = 'en-US'
		expect(getAxisDate('2026-03-01', 'month')).toBe('Mar 2026')
	})

	// @feature charts.x-axis
	it('displays Jalali years for fiscal-year chart labels in Persian', () => {
		session.user.locale = 'fa-IR'
		session.site.fiscal_year_start = '1995-04-01'
		const label = getFormattedDate('2026-03-01', 'fiscal_year')
		expect(label).toContain('1404')
		expect(label).toContain('1405')
	})

	// @feature charts.x-axis
	it('preserves the existing Gregorian fiscal-year label in English', () => {
		session.user.locale = 'en-US'
		session.site.fiscal_year_start = '1995-04-01'
		expect(getFormattedDate('2026-03-01', 'fiscal_year')).toBe('FY 2025-26')
	})
})
