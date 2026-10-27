import { afterEach, describe, expect, it, vi } from 'vitest'
import {
	applyDateRule,
	rulesByColumn,
	type DateOperator,
	type FormattingMode,
} from './formatting_utils'

const PIVOT = ['category', 'Revenue___Men', 'Items___Men', 'Revenue___Women', 'Items___Women']

const rule = (columnName: string) =>
	({
		mode: 'color_scale',
		column: { column_name: columnName },
		value: undefined,
	}) as unknown as FormattingMode

describe('routing a rule to its columns', () => {
	// @feature charts.table-conditional-formatting
	it('names the rendered column itself', () => {
		expect(Object.keys(rulesByColumn([rule('Revenue___Women')], PIVOT))).toEqual([
			'Revenue___Women',
		])
	})

	// @feature charts.table-conditional-formatting
	it('names the measure behind every one of a pivot column', () => {
		expect(Object.keys(rulesByColumn([rule('Revenue')], PIVOT))).toEqual([
			'Revenue___Men',
			'Revenue___Women',
		])
	})

	// @feature charts.table-conditional-formatting
	it('names the dimension value one pivot column stands for', () => {
		expect(Object.keys(rulesByColumn([rule('Women')], PIVOT))).toEqual([
			'Revenue___Women',
			'Items___Women',
		])
	})

	// @feature charts.table-conditional-formatting
	it('paints nothing when it names nothing', () => {
		expect(rulesByColumn([rule('Profit')], PIVOT)).toEqual({})
		expect(rulesByColumn([rule('Revenue___Other')], PIVOT)).toEqual({})
	})

	// @feature charts.table-conditional-formatting
	it('matches a plain column when the table does not pivot', () => {
		expect(Object.keys(rulesByColumn([rule('Revenue')], ['category', 'Revenue']))).toEqual([
			'Revenue',
		])
	})

	// @feature charts.table-conditional-formatting
	it('stacks every rule that names a column', () => {
		const rules = [rule('Revenue'), rule('Revenue___Women')]
		expect(rulesByColumn(rules, PIVOT)['Revenue___Women']).toHaveLength(2)
		expect(rulesByColumn(rules, PIVOT)['Revenue___Men']).toHaveLength(1)
	})

	// @feature charts.table-conditional-formatting
	it('has nothing to route without rules', () => {
		expect(rulesByColumn(undefined, PIVOT)).toEqual({})
		expect(rulesByColumn([], PIVOT)).toEqual({})
	})
})

describe('date rules in the selected calendar', () => {
	afterEach(() => vi.useRealTimers())

	const dateRule = (operator: DateOperator) =>
		({
			mode: 'date_rules',
			column: { type: 'column', column_name: 'posting_date' },
			color: 'green',
			operator,
		}) as const

	// @feature charts.table-conditional-formatting
	it('uses Tehran civil dates and Jalali month/year boundaries for Persian users', () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date('2026-03-20T20:30:00.000Z')) // 00:00 in Tehran on 1 Farvardin 1405
		const context = { locale: 'fa-IR' }

		expect(applyDateRule('2026-03-21', dateRule('is_today'), context)).toBe(true)
		expect(applyDateRule('2026-03-20', dateRule('is_today'), context)).toBe(false)
		expect(applyDateRule('2026-03-20', dateRule('is_last_month'), context)).toBe(true)
		expect(applyDateRule('2026-03-21', dateRule('is_this_month'), context)).toBe(true)
		expect(applyDateRule('2026-04-20', dateRule('is_this_month'), context)).toBe(true)
		expect(applyDateRule('2026-04-21', dateRule('is_next_month'), context)).toBe(true)
		expect(applyDateRule('2026-03-20', dateRule('is_last_year'), context)).toBe(true)
		expect(applyDateRule('2026-03-21', dateRule('is_this_year'), context)).toBe(true)
	})

	// @feature charts.table-conditional-formatting
	it('uses Saturday through Friday for Persian week rules', () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date('2026-03-20T20:30:00.000Z'))
		const context = { locale: 'fa-IR', weekStartsOn: 'Saturday' }

		expect(applyDateRule('2026-03-20', dateRule('is_this_week'), context)).toBe(false)
		expect(applyDateRule('2026-03-21', dateRule('is_this_week'), context)).toBe(true)
		expect(applyDateRule('2026-03-14', dateRule('is_last_week'), context)).toBe(true)
		expect(applyDateRule('2026-03-15', dateRule('is_this_week'), context)).toBe(false)
		expect(applyDateRule('2026-03-22', dateRule('is_this_week'), context)).toBe(true)
		expect(
			applyDateRule('2026-03-15', dateRule('is_this_week'), {
				locale: 'fa-IR',
				weekStartsOn: 'Monday',
			}),
		).toBe(false)
	})

	// @feature charts.table-conditional-formatting
	it('preserves Gregorian month matching for English users', () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date('2026-03-20T20:30:00.000Z'))
		expect(applyDateRule('2026-03-20', dateRule('is_this_month'), { locale: 'en-US' })).toBe(true)
		expect(applyDateRule('2026-03-20', dateRule('is_last_month'), { locale: 'en-US' })).toBe(false)
	})
})
