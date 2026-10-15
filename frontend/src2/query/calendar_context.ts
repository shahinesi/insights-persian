import { dayjs } from 'frappe-ui'
import { currentMonthDateRange } from './components/date_filter'
import { calendarForLocale } from '../localization'
import session from '../session'

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

/** The current reader's request-only calendar semantics for query-backed views. */
export function currentQueryCalendarContext(): QueryCalendarContext {
	const locale =
		typeof document === 'undefined'
			? session.user.locale
			: document.documentElement?.lang || session.user.locale
	return queryCalendarContext(locale, dayjs().format('YYYY-MM-DD'))
}
