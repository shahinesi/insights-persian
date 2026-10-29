import { describe, expect, it } from 'vitest'
import {
	formatDatePickerInput,
	getDatePickerCalendar,
	parseDatePickerInput,
} from './date_picker'

describe('query date picker input', () => {
	// @feature query.filter-date-on-datetime
	it('selects a calendar from the Insights locale, independent of document lang', () => {
		expect(getDatePickerCalendar('fa-IR')).toBe('persian')
		expect(getDatePickerCalendar('fa_IR')).toBe('persian')
		expect(getDatePickerCalendar('FA')).toBe('persian')
		expect(getDatePickerCalendar('en-US')).toBe('gregorian')
	})

	// @feature query.filter-date-on-datetime
	it('shows Jalali input while keeping a Gregorian ISO model value', () => {
		const shown = formatDatePickerInput('2026-03-21', 'fa-IR')
		expect(shown).toContain('1405/01/01')
		expect(shown).not.toMatch(/[۰-۹٠-٩]/)
		expect(parseDatePickerInput(shown, 'fa-IR')).toBe('2026-03-21')
		const legacyLocaleShown = formatDatePickerInput('2026-03-21', 'fa_IR')
		expect(legacyLocaleShown).toContain('1405/01/01')
		expect(parseDatePickerInput(legacyLocaleShown, 'fa_IR')).toBe('2026-03-21')
	})

	// @feature query.filter-date-on-datetime
	it('accepts canonical ISO dates and rejects impossible Persian dates', () => {
		expect(parseDatePickerInput('2026-03-21', 'fa-IR')).toBe('2026-03-21')
		expect(parseDatePickerInput('۱۴۰۴/۱۲/۳۰', 'fa-IR')).toBeNull()
	})

	// @feature query.filter-date-on-datetime
	it('keeps English input Gregorian and unchanged', () => {
		expect(formatDatePickerInput('2026-03-21', 'en-US')).toBe('2026-03-21')
		expect(parseDatePickerInput('2026-03-21', 'en-US')).toBe('2026-03-21')
	})
})
