import { Column } from '../../types/query.types'
import { jalaaliMonthLength, toGregorian, toJalaali } from 'jalaali-js'
import {
	getGregorianDateParts,
	type GregorianDateParts,
} from '../../helpers/locale_format'
import { isPersianLocale } from '../../helpers/locale'

export type ConditionalColor = 'red' | 'amber' | 'green'

export type FormatGroupArgs = {
	formats: FormattingMode[]
	columns: Column[]
}

export type ConditionalOperator = '<' | '<=' | '=' | '>=' | '>' | '!='

export type TextOperator =
	| 'contains'
	| 'not_contains'
	| 'starts_with'
	| 'ends_with'
	| 'equals_text'
	| 'not_equals_text'
	| 'is_empty'
	| 'is_not_empty'

export type DateOperator =
	| 'is_today'
	| 'is_yesterday'
	| 'is_tomorrow'
	| 'is_this_week'
	| 'is_last_week'
	| 'is_next_week'
	| 'is_this_month'
	| 'is_last_month'
	| 'is_next_month'
	| 'is_this_year'
	| 'is_last_year'
	| 'is_next_year'
	| 'date_between'
	| 'date_before'
	| 'date_after'

export type RankOperator =
	| 'top_n'
	| 'bottom_n'
	| 'top_percent'
	| 'bottom_percent'
	| 'above_average'
	| 'below_average'

export type color_scale = {
	mode: 'color_scale'
	column: Column
	colorScale?: string
	scaleScope?: 'global' | 'local'
	value: number | undefined
}

// highlight cell rules
export type cell_rules = {
	mode: 'cell_rules'
	column: Column
	color?: string
	operator?: ConditionalOperator
	value: number | undefined
}

export type text_rules = {
	mode: 'text_rules'
	column: Column
	color: string
	operator: TextOperator
	value: string | undefined
}

export type date_rules = {
	mode: 'date_rules'
	column: Column
	color: string
	operator: DateOperator
	value?: string | Date | [Date, Date] | undefined
}

export type rank_rules = {
	mode: 'rank_rules'
	column: Column
	color: string
	operator: RankOperator
	value: number | undefined
}

// rule and color scale based coloring of cell
export type FormattingMode = color_scale | cell_rules | text_rules | date_rules | rank_rules

/**
 * ibis pivots to `{measure}___{value1}___{value2}`, so the measure is the first
 * part and a dimension value is any part after it.
 */
function measureOf(columnName: string): string {
	return columnName.includes('___') ? columnName.split('___')[0] : columnName
}

/**
 * Which rules paint which column. A rule names one of three things, and each is
 * a whole name rather than a fragment:
 *
 *   "Revenue___Women"  the rendered column itself
 *   "Revenue"          the measure behind every one of a pivot's columns
 *   "Women"            the dimension value one pivot column stands for
 *
 * A rule that names none of them paints nothing. It used to widen to every
 * numeric column, which turns one stale name into a colored table and reads as
 * a fault in the palette rather than in the rule.
 */
export function rulesByColumn(
	formats: FormattingMode[] | undefined,
	columnNames: string[],
): Record<string, FormattingMode[]> {
	const result: Record<string, FormattingMode[]> = {}
	if (!formats?.length) return result

	formats.forEach((format) => {
		const target = 'column' in format ? format.column?.column_name : null
		if (!target) return

		columnNames
			.filter(
				(name) =>
					name === target || measureOf(name) === target || name.endsWith(`___${target}`),
			)
			.forEach((name) => {
				;(result[name] ??= []).push(format)
			})
	})

	return result
}

// helper functions for date comparison
type CivilDate = GregorianDateParts
type CalendarDate = CivilDate & { calendarYear: number; calendarMonth: number }

function parseDateValue(value: any): Date | null {
	if (value === null || value === undefined || value === '') return null
	if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
	if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
		const [year, month, day] = value.split('-').map(Number)
		const date = new Date(Date.UTC(year, month - 1, day))
		return date.getUTCFullYear() === year &&
			date.getUTCMonth() === month - 1 &&
			date.getUTCDate() === day
			? date
			: null
	}
	const date = new Date(value)
	return Number.isNaN(date.getTime()) ? null : date
}

function civilDate(date: Date, persian: boolean): CivilDate {
	if (!persian) {
		return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() }
	}
	return getGregorianDateParts(date, 'Asia/Tehran')
}

function calendarDate(date: Date, persian: boolean): CalendarDate {
	const civil = civilDate(date, persian)
	if (!persian) return { ...civil, calendarYear: civil.year, calendarMonth: civil.month }
	const jalali = toJalaali(civil.year, civil.month, civil.day)
	return { ...civil, calendarYear: jalali.jy, calendarMonth: jalali.jm }
}

function shiftedCivilDate(date: CivilDate, days: number): CivilDate {
	const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days))
	return {
		year: shifted.getUTCFullYear(),
		month: shifted.getUTCMonth() + 1,
		day: shifted.getUTCDate(),
	}
}

function previousOrNextPersianMonth(date: CalendarDate, direction: -1 | 1): CalendarDate {
	const currentLength = jalaaliMonthLength(date.calendarYear, date.calendarMonth)
	const gregorian = toGregorian(date.calendarYear, date.calendarMonth, direction < 0 ? 1 : currentLength)
	const targetCivil = shiftedCivilDate(
		{ year: gregorian.gy, month: gregorian.gm, day: gregorian.gd },
		direction < 0 ? -1 : 1,
	)
	return calendarDate(
		new Date(Date.UTC(targetCivil.year, targetCivil.month - 1, targetCivil.day)),
		true,
	)
}

function isSameWeek(
	date1: Date,
	date2: Date,
	persian = false,
	weekStartsOn = 'Saturday',
): boolean {
	if (persian) {
		const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
		const firstWeekday = weekdays.indexOf(weekStartsOn)
		const firstDay = firstWeekday < 0 ? 6 : firstWeekday
		const weekStart = (date: Date) => {
			const civil = civilDate(date, true)
			const day = new Date(Date.UTC(civil.year, civil.month - 1, civil.day))
			const daysSinceWeekStart = (day.getUTCDay() - firstDay + 7) % 7
			return Date.UTC(civil.year, civil.month - 1, civil.day - daysSinceWeekStart)
		}
		return weekStart(date1) === weekStart(date2)
	}
	const week1 = getWeekNumber(date1)
	const week2 = getWeekNumber(date2)
	return week1.week === week2.week && week1.year === week2.year
}

function getWeekNumber(date: Date): { week: number; year: number } {
	const d = new Date(date)
	d.setHours(0, 0, 0, 0)
	d.setDate(d.getDate() + 4 - (d.getDay() || 7))
	const yearStart = new Date(d.getFullYear(), 0, 1)
	const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
	return { week: weekNumber, year: d.getFullYear() }
}

//convert the given input to number
export function useNumber(num: any) {
	const valueStr = String(num)
	const cleanVal = valueStr.replace(/,|\s/g, '')
	const result = parseFloat(cleanVal)
	if (isNaN(result)) {
		return null
	}
	return result
}

export function applyRule(value: any, rule: cell_rules): boolean {
	const numberVal = useNumber(value)
	if (numberVal === null) return false
	switch (rule.operator) {
		case '<':
			return numberVal < (rule.value as number)
		case '<=':
			return numberVal <= (rule.value as number)
		case '=':
			return numberVal === (rule.value as number)
		case '>':
			return numberVal > (rule.value as number)
		case '>=':
			return numberVal >= (rule.value as number)
		case '!=':
			return numberVal !== (rule.value as number)
		default:
			return false
	}
}

export function applyTextRule(value: any, rule: text_rules): boolean {
	const textVal = String(value).toLowerCase()
	const ruleValue = String(rule.value || '').toLowerCase()

	switch (rule.operator) {
		case 'contains':
			return textVal.includes(ruleValue)
		case 'not_contains':
			return !textVal.includes(ruleValue)
		case 'starts_with':
			return textVal.startsWith(ruleValue)
		case 'ends_with':
			return textVal.endsWith(ruleValue)
		case 'equals_text':
			return textVal === ruleValue
		case 'not_equals_text':
			return textVal !== ruleValue
		case 'is_empty':
			return textVal.trim() === ''
		case 'is_not_empty':
			return textVal.trim() !== ''
		default:
			return false
	}
}

export function applyDateRule(
	value: any,
	rule: date_rules,
	context: { locale?: string | null; now?: Date; weekStartsOn?: string } = {},
): boolean {
	const dateVal = parseDateValue(value)
	if (!dateVal) return false

	const persian = isPersianLocale(context.locale)
	const today = context.now || new Date()
	const todayCivil = civilDate(today, persian)
	const yesterday = shiftedCivilDate(todayCivil, -1)
	const tomorrow = shiftedCivilDate(todayCivil, 1)
	const dateCalendar = calendarDate(dateVal, persian)
	const todayCalendar = calendarDate(today, persian)
	const previousMonth = persian
		? previousOrNextPersianMonth(todayCalendar, -1)
		: calendarDate(new Date(today.getFullYear(), today.getMonth() - 1, 1), false)
	const nextMonth = persian
		? previousOrNextPersianMonth(todayCalendar, 1)
		: calendarDate(new Date(today.getFullYear(), today.getMonth() + 1, 1), false)
	const isSameCalendarDay = (target: CivilDate) =>
		dateCalendar.year === target.year &&
		dateCalendar.month === target.month &&
		dateCalendar.day === target.day
	const isSameCalendarMonth = (target: CalendarDate) =>
		dateCalendar.calendarYear === target.calendarYear &&
		dateCalendar.calendarMonth === target.calendarMonth
	const isSameCalendarYear = (targetYear: number) => dateCalendar.calendarYear === targetYear

	switch (rule.operator) {
		case 'is_today':
			return isSameCalendarDay(todayCivil)
		case 'is_yesterday':
			return isSameCalendarDay(yesterday)
		case 'is_tomorrow':
			return isSameCalendarDay(tomorrow)
		case 'is_this_week':
			return isSameWeek(dateVal, today, persian, context.weekStartsOn)
		case 'is_last_week':
			const lastWeekCivil = shiftedCivilDate(todayCivil, -7)
			const lastWeek = new Date(
				Date.UTC(lastWeekCivil.year, lastWeekCivil.month - 1, lastWeekCivil.day),
			)
			return isSameWeek(dateVal, lastWeek, persian, context.weekStartsOn)
		case 'is_next_week':
			const nextWeekCivil = shiftedCivilDate(todayCivil, 7)
			const nextWeek = new Date(
				Date.UTC(nextWeekCivil.year, nextWeekCivil.month - 1, nextWeekCivil.day),
			)
			return isSameWeek(dateVal, nextWeek, persian, context.weekStartsOn)
		case 'is_this_month':
			return isSameCalendarMonth(todayCalendar)
		case 'is_last_month':
			return isSameCalendarMonth(previousMonth)
		case 'is_next_month':
			return isSameCalendarMonth(nextMonth)
		case 'is_this_year':
			return isSameCalendarYear(todayCalendar.calendarYear)
		case 'is_last_year':
			return isSameCalendarYear(todayCalendar.calendarYear - 1)
		case 'is_next_year':
			return isSameCalendarYear(todayCalendar.calendarYear + 1)
		case 'date_between':
			if (Array.isArray(rule.value) && rule.value.length === 2) {
				const [start, end] = rule.value.map((date) => new Date(date))
				return dateVal >= start && dateVal <= end
			}
			return false
		case 'date_before':
			const beforeDate = new Date(rule.value as string)
			return dateVal < beforeDate
		case 'date_after':
			const afterDate = new Date(rule.value as string)
			return dateVal > afterDate
		default:
			return false
	}
}

export function applyRankRule(value: any, rule: rank_rules, allValues: number[]): boolean {
	const numVal = useNumber(value)
	if (numVal === null) return false
	const numericValues = [...allValues].sort((a, b) => b - a)

	if (numericValues.length === 0) return false

	const n = rule.value || 0
	const average = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
	// todo: use custom expression
	switch (rule.operator) {
		case 'top_n':
			return numericValues.slice(0, n).includes(numVal)
		case 'bottom_n':
			return numericValues.slice(-n).includes(numVal)
		case 'top_percent':
			const topCount = Math.ceil((n / 100) * numericValues.length)
			return numericValues.slice(0, topCount).includes(numVal)
		case 'bottom_percent':
			const bottomCount = Math.ceil((n / 100) * numericValues.length)
			return numericValues.slice(-bottomCount).includes(numVal)
		case 'above_average':
			return numVal > average
		case 'below_average':
			return numVal < average
		default:
			return false
	}
}
