import { afterEach, describe, expect, it, vi } from 'vitest'
import {
	formatLocaleDate,
	formatLocaleNumber,
	getISODateFromPersianDate,
	getPersianDateFromISO,
} from 'frappe-ui/localization'
import { directionForLocale, displayLocale } from './localization'

afterEach(() => vi.unstubAllGlobals())

describe('document direction for locale', () => {
	it('uses RTL for Persian language tags', () => {
		expect(directionForLocale('fa')).toBe('rtl')
		expect(directionForLocale('fa-IR')).toBe('rtl')
	})

	it('keeps English and unrelated locales LTR', () => {
		expect(directionForLocale('en-US')).toBe('ltr')
		expect(directionForLocale('de')).toBe('ltr')
	})

	it('keeps Persian user locale while retaining the English India fallback', () => {
		expect(displayLocale('fa-IR', 'India')).toBe('fa-IR')
		expect(displayLocale('en', 'India')).toBe('en-IN')
		expect(displayLocale(undefined, 'India')).toBe('en-IN')
	})

	it('formats Persian presentation while preserving ISO dates and real zero values', () => {
		vi.stubGlobal('document', { documentElement: { lang: 'fa-IR', dir: 'rtl' } })
		expect(formatLocaleNumber(0)).toBe('۰')
		expect(formatLocaleNumber(null)).toBe('')
		expect(formatLocaleNumber(Number.NaN)).toBe('')
		expect(formatLocaleDate('2026-03-21', { calendar: 'persian', day: 'numeric', month: 'long', year: 'numeric' })).not.toContain('2026')
	})

	it('round-trips Gregorian ISO dates through the Persian calendar model', () => {
		for (const isoDate of ['2024-03-20', '2025-03-20', '2026-03-21']) {
			expect(getISODateFromPersianDate(getPersianDateFromISO(isoDate))).toBe(isoDate)
		}
	})
})
