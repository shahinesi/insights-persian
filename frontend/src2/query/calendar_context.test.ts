import { describe, expect, it } from 'vitest'
import { queryCalendarContext } from './calendar_context'

describe('query calendar context', () => {
	it('sends Persian current-month ISO bounds as runtime execution context', () => {
		expect(queryCalendarContext('fa-IR', '2026-10-15')).toEqual({
			calendar: 'persian',
			anchor: '2026-10-15',
			current_month_range: ['2026-09-23', '2026-10-22'],
		})
	})

	it('keeps Gregorian callers explicit without adding persisted filter metadata', () => {
		expect(queryCalendarContext('en-US', '2026-10-15')).toEqual({ calendar: 'gregorian' })
	})
})
