import { currentMonthDateRange } from './components/date_filter'
import { calendarForLocale } from '../localization'

export type QueryCalendarContext = {
	calendar: 'gregorian' | 'persian'
	anchor?: string
	current_month_range?: [string, string]
}

/** Runtime calendar semantics for query execution; never persisted with a filter. */
export function queryCalendarContext(locale: string, anchor: string): QueryCalendarContext {
	const calendar = calendarForLocale(locale)
	return calendar === 'persian'
		? { calendar, anchor, current_month_range: currentMonthDateRange(locale, anchor) }
		: { calendar }
}
