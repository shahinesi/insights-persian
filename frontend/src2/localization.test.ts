import { afterEach, describe, expect, it, vi } from 'vitest'
import {
	formatLocaleDate,
	formatLocaleNumber,
	getISODateFromPersianDate,
	getPersianDateFromISO,
} from 'frappe-ui/localization'
import {
	applyDocumentLocale,
	calendarForLocale,
	directionForLocale,
	displayLocale,
} from './localization'

afterEach(() => vi.unstubAllGlobals())

describe('document direction for locale', () => {
	// @feature settings.locale-presentation
	it('uses RTL for Persian language tags', () => {
		expect(directionForLocale('fa')).toBe('rtl')
		expect(directionForLocale('fa-IR')).toBe('rtl')
	})

	// @feature settings.locale-presentation
	it('keeps English and unrelated locales LTR', () => {
		expect(directionForLocale('en-US')).toBe('ltr')
		expect(directionForLocale('de')).toBe('ltr')
	})

	// @feature settings.locale-presentation
	it('keeps Persian user locale while retaining the English India fallback', () => {
		expect(displayLocale('fa-IR', 'India')).toBe('fa-IR')
		expect(displayLocale('en', 'India')).toBe('en-IN')
		expect(displayLocale(undefined, 'India')).toBe('en-IN')
	})

	// @feature settings.locale-presentation query.filter-date-summary-locale query.filter-number-zero-null
	it('formats Persian presentation while preserving ISO dates and real zero values', () => {
		vi.stubGlobal('document', { documentElement: { lang: 'fa-IR', dir: 'rtl' } })
		expect(formatLocaleNumber(0)).toBe('۰')
		expect(formatLocaleNumber(null)).toBe('')
		expect(formatLocaleNumber(Number.NaN)).toBe('')
		expect(formatLocaleDate('2026-03-21', { calendar: 'persian', day: 'numeric', month: 'long', year: 'numeric' })).not.toContain('2026')
	})

	// @feature settings.locale-presentation query.filter-date-summary-locale
	it('round-trips Gregorian ISO dates through the Persian calendar model', () => {
		for (const isoDate of ['2024-03-20', '2025-03-20', '2026-03-21']) {
			expect(getISODateFromPersianDate(getPersianDateFromISO(isoDate))).toBe(isoDate)
		}
	})
})

describe('document presentation for locale', () => {
	// @feature settings.locale-presentation
	it('enables the shared Vazirmatn utility only for Persian', () => {
		const toggle = vi.fn()
		const root = { lang: '', dir: '', classList: { toggle } }
		vi.stubGlobal('document', { documentElement: root })

		applyDocumentLocale('fa-IR')
		expect(root.lang).toBe('fa-IR')
		expect(root.dir).toBe('rtl')
		expect(toggle).toHaveBeenLastCalledWith('fui-vazirmatn', true)

		applyDocumentLocale('en-US')
		expect(root.dir).toBe('ltr')
		expect(toggle).toHaveBeenLastCalledWith('fui-vazirmatn', false)
	})
})

describe('calendar selected for a document locale', () => {
	// @feature settings.locale-presentation
	it('selects the shared Persian calendar for Persian language tags', () => {
		expect(calendarForLocale('fa')).toBe('persian')
		expect(calendarForLocale('fa-IR')).toBe('persian')
		expect(calendarForLocale('fa_IR')).toBe('persian')
	})

	// @feature settings.locale-presentation
	it('keeps the shared date picker Gregorian for other locales and missing locale', () => {
		expect(calendarForLocale('en-US')).toBe('gregorian')
		expect(calendarForLocale('ar')).toBe('gregorian')
		expect(calendarForLocale(undefined)).toBe('gregorian')
	})
})
