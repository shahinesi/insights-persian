import { afterEach, describe, expect, it, vi } from 'vitest'
import type { QueryResult } from '../types/query.types'
import { emptyResult, getAxisDate, getFormattedDate, rawRowOf } from './helpers'

afterEach(() => vi.unstubAllGlobals())

function resultOf(rows: QueryResult['rows']): QueryResult {
	return {
		...emptyResult(),
		rows,
		// the formatting itself is not what is under test here, only that a
		// formatted row is a different object than the raw one behind it
		formattedRows: rows.map((row) => ({ ...row })),
	}
}

describe('the raw row behind a formatted one', () => {
	// @feature query.result-raw-row
	it('is the row at the same position', () => {
		const result = resultOf([{ revenue: 1 }, { revenue: 2 }])
		expect(rawRowOf(result, result.formattedRows[1])).toBe(result.rows[1])
	})

	// @feature query.result-raw-row
	it('is nothing for a row the result does not include', () => {
		const result = resultOf([{ revenue: 1 }])
		expect(rawRowOf(result, { revenue: 99 })).toBeUndefined()
	})

	// An execution writes the new rows into the same result object, so a lookup
	// cached against that object would answer the second run from the first
	// run's rows and every cell would read as nothing.
	// @feature query.result-raw-row
	it('follows the rows a second execution writes into the same result', () => {
		const result = resultOf([{ revenue: 1 }])
		rawRowOf(result, result.formattedRows[0])

		const second = resultOf([{ revenue: 2 }, { revenue: 3 }])
		result.rows = second.rows
		result.formattedRows = second.formattedRows

		expect(rawRowOf(result, result.formattedRows[0])).toBe(result.rows[0])
		expect(rawRowOf(result, result.formattedRows[1])).toBe(result.rows[1])
	})
})

describe('chart date labels follow the active calendar', () => {
	it('uses the shared Jalali formatter for Persian chart grains', () => {
		vi.stubGlobal('document', { documentElement: { lang: 'fa-IR' } })

		const day = getFormattedDate('2026-10-01', 'day')
		expect(day).toContain('مهر')
		expect(day).toContain('۱۴۰۵')
		expect(day).not.toContain('October')
		expect(getFormattedDate('2026-10-01', 'month')).toContain('مهر')
		expect(getFormattedDate('2026-10-01', 'year')).toContain('۱۴۰۵')
		expect(getFormattedDate('2026-10-01', 'quarter')).toContain('۱۴۰۵')
		expect(getAxisDate('2026-10-01', 'month')).toContain('مهر')
		expect(getAxisDate('2026-10-01', 'month')).toContain('۱۴۰۵')
	})

	it('keeps chart labels Gregorian when the document language is English', () => {
		vi.stubGlobal('document', { documentElement: { lang: 'en-US' } })

		expect(getFormattedDate('2026-10-01', 'month')).toContain('October')
		expect(getFormattedDate('2026-10-01', 'year')).toBe('2026')
		expect(getFormattedDate('2026-10-01', 'quarter')).toBe('Q4, 2026')
		expect(getAxisDate('2026-10-01', 'month')).toContain('Oct')
	})
})
