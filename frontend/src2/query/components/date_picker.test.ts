import { describe, expect, it } from 'vitest'
import { formatDatePickerInput, parseDatePickerInput } from './date_picker'

describe('query date picker input', () => {
	// @feature query.filter-date-on-datetime
	it('shows Jalali input while keeping a Gregorian ISO model value', () => {
		const shown = formatDatePickerInput('2026-03-21', 'fa-IR')
		expect(shown).toContain('۱۴۰۵/۰۱/۰۱')
		expect(parseDatePickerInput(shown, 'fa-IR')).toBe('2026-03-21')
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
