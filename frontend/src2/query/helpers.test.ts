import { afterEach, describe, expect, it } from 'vitest'
import session from '../session'
import { getAxisDate, getFormattedDate } from './helpers'

const initialLocale = session.user.locale

afterEach(() => {
	session.user.locale = initialLocale
})

describe('localized chart date labels', () => {
	// @feature charts.x-axis
	it('labels Gregorian month buckets with their Jalali date span in Persian', () => {
		session.user.locale = 'fa-IR'
		expect(getAxisDate('2026-03-01', 'month')).toContain('۱۴۰۴')
		expect(getFormattedDate('2026-03-01', 'month')).toContain('۱۴۰۵')
	})

	// @feature charts.x-axis
	it('keeps the Gregorian month label in English', () => {
		session.user.locale = 'en-US'
		expect(getAxisDate('2026-03-01', 'month')).toBe('Mar 2026')
	})
})
