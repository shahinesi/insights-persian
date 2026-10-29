// The calendar the site counts by, in the browser.
//
// A week does not start on the same day everywhere and a fiscal year does not
// start in January everywhere, and both are site settings: `week_starts_on` and
// `fiscal_year_start` on `Insights Settings`, sent with the site info so a guest
// on a public link gets them too. dayjs knows neither, so a span the browser
// resolves through `startOf('week')` landed on a different Monday from the one
// `get_first_day_of_week` lands on, and a fiscal year had no dayjs unit at all.
//
// The server's answer is `get_current_date_range` in `sql_functions.py`. This is
// the same answer in dayjs, for the range a picker prints before the query runs.

import type { Dayjs } from 'dayjs'
import dayjs from './dayjs'
import session from '../session'
import { jalaaliMonthLength, toGregorian, toJalaali } from 'jalaali-js'
import { getGregorianDateParts, type GregorianDateParts } from './locale_format'
import { parseSpan, type SpanUnit } from './span_grammar'
import { isPersianLocale } from './locale'

/** What the server falls back to, in `get_fiscal_year_start_date`. */
const FISCAL_YEAR_START = '1995-04-01'

/** Monday-first, the way `Insights Settings` lists the days. */
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/** The week's first day as dayjs numbers it: Sunday 0 through Saturday 6. */
function weekStartDay(): number {
	const index = WEEKDAYS.indexOf(session.site?.week_starts_on || 'Monday')
	return ((index < 0 ? 0 : index) + 1) % 7
}

/** The month and day a fiscal year starts on. */
function fiscalYearStart(): { month: number; date: number } {
	const start = dayjs(session.site?.fiscal_year_start || FISCAL_YEAR_START)
	return start.isValid() ? { month: start.month(), date: start.date() } : { month: 3, date: 1 }
}

/** The first day of the period of `unit` that `date` falls in. */
export function startOfPeriod(date: Dayjs, unit: SpanUnit): Dayjs {
	if (unit === 'week') {
		return date.subtract((date.day() - weekStartDay() + 7) % 7, 'day').startOf('day')
	}
	if (unit === 'fiscal year') {
		const { month, date: day } = fiscalYearStart()
		const start = date.month(month).date(day).startOf('day')
		return date.isBefore(start) ? start.subtract(1, 'year') : start
	}
	// dayjs types `quarter` only through the plugin `helpers/dayjs` loads
	return date.startOf(unit as any)
}

/** The last day of the period of `unit` that `date` falls in. */
export function endOfPeriod(date: Dayjs, unit: SpanUnit): Dayjs {
	if (unit === 'week' || unit === 'fiscal year') {
		return shiftPeriods(startOfPeriod(date, unit), unit, 1).subtract(1, 'day')
	}
	return date.endOf(unit as any)
}

/** `date` moved `count` periods of `unit`. */
export function shiftPeriods(date: Dayjs, unit: SpanUnit, count: number): Dayjs {
	if (unit === 'quarter') return date.add(count * 3, 'month')
	// a fiscal year is twelve months long wherever it starts, so it moves by the year
	if (unit === 'fiscal year') return date.add(count, 'year')
	return date.add(count, unit as any)
}

type JalaliPeriodUnit = Extract<SpanUnit, 'month' | 'quarter' | 'year'>

function gregorianDay(value?: Date | string): GregorianDateParts | undefined {
	if (typeof value === 'string') {
		const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
		if (match) {
			const [, year, month, day] = match.map(Number)
			const parsed = new Date(Date.UTC(year, month - 1, day))
			if (
				parsed.getUTCFullYear() !== year ||
				parsed.getUTCMonth() !== month - 1 ||
				parsed.getUTCDate() !== day
			)
				return undefined
			return { year, month, day }
		}
	}
	const date = value === undefined ? new Date() : value instanceof Date ? value : new Date(value)
	return Number.isNaN(date.getTime()) ? undefined : getGregorianDateParts(date, 'Asia/Tehran')
}

function isoDate({ year, month, day }: GregorianDateParts): string {
	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function shiftGregorianDay(value: string, days: number): string {
	const [year, month, day] = value.split('-').map(Number)
	const shifted = new Date(Date.UTC(year, month - 1, day + days))
	return isoDate({
		year: shifted.getUTCFullYear(),
		month: shifted.getUTCMonth() + 1,
		day: shifted.getUTCDate(),
	})
}

/** A Jalali calendar period expressed as canonical Gregorian ISO endpoints. */
export function jalaliPeriodRange(
	anchor: Date | string | undefined,
	unit: JalaliPeriodUnit,
	offset = 0,
): [string, string] | undefined {
	const civil = gregorianDay(anchor)
	if (!civil) return undefined
	const { jy, jm } = toJalaali(civil.year, civil.month, civil.day)
	const monthsPerPeriod = unit === 'month' ? 1 : unit === 'quarter' ? 3 : 12
	const currentStartMonth =
		unit === 'month' ? jm : unit === 'quarter' ? Math.floor((jm - 1) / 3) * 3 + 1 : 1
	const startIndex = (jy - 1) * 12 + currentStartMonth - 1 + offset * monthsPerPeriod
	const startYear = Math.floor(startIndex / 12) + 1
	const startMonth = (((startIndex % 12) + 12) % 12) + 1
	const endIndex = startIndex + monthsPerPeriod - 1
	const endYear = Math.floor(endIndex / 12) + 1
	const endMonth = (((endIndex % 12) + 12) % 12) + 1
	const start = toGregorian(startYear, startMonth, 1)
	const end = toGregorian(endYear, endMonth, jalaaliMonthLength(endYear, endMonth))
	return [
		isoDate({ year: start.gy, month: start.gm, day: start.gd }),
		isoDate({ year: end.gy, month: end.gm, day: end.gd }),
	]
}

/** Resolve a month, quarter, or year span on the Jalali calendar for its ISO API range. */
export function resolvePersianSpan(span: string, anchor?: string): [string, string] | undefined {
	const parsed = parseSpan(span)
	if (!parsed || !['month', 'quarter', 'year'].includes(parsed.unit)) return undefined
	const unit = parsed.unit as JalaliPeriodUnit
	const current = jalaliPeriodRange(anchor, unit)
	if (!current) return undefined
	if (parsed.shape === 'current') return current
	if (parsed.shape === 'to date') {
		const currentDay = gregorianDay(anchor)
		return currentDay ? [current[0], isoDate(currentDay)] : undefined
	}
	if (parsed.shape === 'last') {
		const first = jalaliPeriodRange(anchor, unit, -parsed.count)
		return first
			? [first[0], parsed.includeCurrent ? current[1] : shiftGregorianDay(current[0], -1)]
			: undefined
	}
	const first = jalaliPeriodRange(anchor, unit, parsed.includeCurrent ? 0 : 1)
	const last = jalaliPeriodRange(anchor, unit, parsed.count)
	return first && last ? [first[0], last[1]] : undefined
}

/** Keep English relative spans intact; send Persian calendar periods as ISO bounds. */
export function calendarSpanFilter(
	span: string,
	locale: string | null | undefined,
	anchor?: string,
):
	| { operator: 'between'; value: [string, string] }
	| { operator: 'within'; value: { span: string } } {
	if (isPersianLocale(locale)) {
		const range = resolvePersianSpan(span, anchor)
		if (range) return { operator: 'between', value: range }
	}
	return { operator: 'within', value: { span } }
}
