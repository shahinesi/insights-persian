import type { FilterOperator } from '../../types/query.types'
import {
	getPersianCalendarMonth,
	getPersianDateFromISO,
} from 'frappe-ui/localization'
import dayjs from '../../helpers/dayjs'
import { calendarForLocale } from '../../localization'

/** Resolve the current display-calendar month to canonical ISO date endpoints. */
export function currentMonthDateRange(locale: string, anchorISO: string): [string, string] {
	if (calendarForLocale(locale) === 'persian') {
		const date = getPersianDateFromISO(anchorISO)
		const currentMonth = getPersianCalendarMonth(date.year, date.month, locale)
		const days = currentMonth.weeks.flat().filter((day) => day.isCurrentMonth)
		const first = days[0]?.isoDate
		const last = days.at(-1)?.isoDate
		if (!first || !last) throw new RangeError('Persian calendar month has no date cells')
		return [first, last]
	}

	const date = dayjs(anchorISO)
	if (!date.isValid()) throw new RangeError('Current month anchor must be a valid ISO date')
	return [date.startOf('month').format('YYYY-MM-DD'), date.endOf('month').format('YYYY-MM-DD')]
}

export type SpecificDateFilter = {
	operator: FilterOperator
	value: string[]
}

export function setDateRangeEndpoint(
	current: string[],
	endpoint: 0 | 1,
	value: string,
	range = true,
): string[] {
	const dates = [current[0] || '', current[1] || '']
	dates[endpoint] = value || ''

	if (!range) return dates[0] ? [dates[0]] : []
	if (dates[0] && dates[1] && dates[0] > dates[1]) {
		return [dates[1], dates[0]]
	}
	return dates[0] || dates[1] ? dates : []
}

export function getSpecificDateFilter(value: string[]): SpecificDateFilter {
	if (value[0] === value[1]) return { operator: '=', value }
	if (value[0] && !value[1]) return { operator: '>=', value }
	if (!value[0] && value[1]) return { operator: '<=', value }
	if (value[0] && value[1]) return { operator: 'between', value }
	return { operator: '=', value }
}
