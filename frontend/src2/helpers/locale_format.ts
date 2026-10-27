import { digitsArToFa, digitsFaToEn } from '@persian-tools/persian-tools'
import { toJalaali } from 'jalaali-js'

const PERSIAN_MONTHS = [
	'فروردین',
	'اردیبهشت',
	'خرداد',
	'تیر',
	'مرداد',
	'شهریور',
	'مهر',
	'آبان',
	'آذر',
	'دی',
	'بهمن',
	'اسفند',
] as const
const ENGLISH_PERSIAN_MONTHS = [
	'Farvardin',
	'Ordibehesht',
	'Khordad',
	'Tir',
	'Mordad',
	'Shahrivar',
	'Mehr',
	'Aban',
	'Azar',
	'Dey',
	'Bahman',
	'Esfand',
] as const

function monthName(month: number, locale: string, style: 'long' | 'short' = 'long'): string {
	const isPersian = locale.toLowerCase().startsWith('fa')
	const name = isPersian
		? PERSIAN_MONTHS[month - 1] || ''
		: ENGLISH_PERSIAN_MONTHS[month - 1] || ''
	// Persian month names do not have safe three-character abbreviations; for
	// example, cutting Farvardin produces a fragment rather than a month name.
	if (isPersian) return name
	return style === 'short' ? name.slice(0, 3) : name
}

/** Format display values with the locale the current Frappe user selected. */
export function formatLocaleDate(
	value: Date | string | number | null | undefined,
	locale: string | null | undefined,
	options: Intl.DateTimeFormatOptions = {},
): string {
	if (value === null || value === undefined || value === '') return ''
	const language = locale || 'en-US'
	const isPersian = language.toLowerCase().startsWith('fa')
	const useJalali =
		options.calendar === 'persian' || (isPersian && options.calendar === undefined)
	const hasTime =
		options.hour !== undefined || options.minute !== undefined || options.second !== undefined
	const displayTimeZone = options.timeZone || (useJalali ? 'Asia/Tehran' : undefined)
	let date: Date
	let dateOnly = false

	if (value instanceof Date) {
		if (Number.isNaN(value.getTime())) return ''
		dateOnly = !hasTime
		if (dateOnly) {
			const civil = displayTimeZone
				? getGregorianDateParts(value, displayTimeZone)
				: { year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate() }
			date = new Date(Date.UTC(civil.year, civil.month - 1, civil.day))
		} else date = value
	} else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
		const [year, month, day] = value.split('-').map(Number)
		date = new Date(Date.UTC(year, month - 1, day))
		if (
			date.getUTCFullYear() !== year ||
			date.getUTCMonth() !== month - 1 ||
			date.getUTCDate() !== day
		)
			return ''
		dateOnly = true
	} else {
		date = new Date(typeof value === 'string' ? value.replace(' ', 'T') : value)
		if (Number.isNaN(date.getTime())) return ''
	}

	const formatOptions: Intl.DateTimeFormatOptions = {
		...options,
		...(useJalali ? { calendar: 'gregory' } : {}),
		...(displayTimeZone ? { timeZone: displayTimeZone } : {}),
		numberingSystem: 'latn',
		...(dateOnly && !hasTime ? { timeZone: 'UTC' } : {}),
	}
	const formatter = new Intl.DateTimeFormat(language, formatOptions)
	if (!useJalali) return formatter.format(date)
	const fields = jalaliFields(date, formatOptions.timeZone)
	return formatter
		.formatToParts(date)
		.map((part) => {
			if (part.type === 'year') return String(fields.jy)
			if (part.type === 'day') {
				return options.day === '2-digit'
					? String(fields.jd).padStart(2, '0')
					: String(fields.jd)
			}
			if (part.type === 'month') {
				if (options.month === 'numeric' || options.month === '2-digit') {
					return options.month === '2-digit'
						? String(fields.jm).padStart(2, '0')
						: String(fields.jm)
				}
				const style: 'long' | 'short' =
					options.month === 'long' || options.month === 'short'
						? options.month
						: options.dateStyle === 'long' || options.dateStyle === 'full'
							? 'long'
							: 'short'
				return monthName(fields.jm, language, style)
			}
			return part.value
		})
		.join('')
}

export type GregorianDateParts = { year: number; month: number; day: number }

/** Read Gregorian civil date parts for the requested timezone. */
export function getGregorianDateParts(date: Date, timeZone?: string): GregorianDateParts {
	const parts = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		timeZone,
	}).formatToParts(date)
	const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
	return { year: Number(values.year), month: Number(values.month), day: Number(values.day) }
}

function jalaliFields(date: Date, timeZone?: string) {
	const { year, month, day } = getGregorianDateParts(date, timeZone)
	return toJalaali(year, month, day)
}

export function formatLocaleDateRange(
	start: Date | string | number | null | undefined,
	end: Date | string | number | null | undefined,
	locale: string | null | undefined,
	options: Intl.DateTimeFormatOptions = {},
): string {
	const first = formatLocaleDate(start, locale, options)
	const last = formatLocaleDate(end, locale, options)
	return first && last ? `${first} – ${last}` : ''
}

export function formatLocaleNumber(
	value: number,
	locale: string | null | undefined,
	options: Intl.NumberFormatOptions = {},
): string {
	return new Intl.NumberFormat(locale || 'en-US', {
		...options,
		numberingSystem: 'latn',
	}).format(value)
}

export function directionForLocale(locale: string | null | undefined): 'ltr' | 'rtl' {
	const language = (locale || 'en').toLowerCase().split(/[-_]/, 1)[0]
	return ['ar', 'ckb', 'dv', 'fa', 'he', 'ps', 'ur', 'yi'].includes(language) ? 'rtl' : 'ltr'
}

export function parseLocaleNumber(value: string): number | undefined {
	const normalized = digitsFaToEn(digitsArToFa(value.trim()))
		.replace(/[٬,\s]/g, '')
		.replace(/٫/g, '.')
	if (!normalized) return undefined
	const parsed = Number(normalized)
	return Number.isFinite(parsed) ? parsed : undefined
}

export function formatLocaleTime(
	value: string,
	locale: string | null | undefined,
	options: Intl.DateTimeFormatOptions = {},
): string {
	const match = /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/.exec(value)
	if (!match) return value
	const [, hour, minute, second = '0'] = match
	const date = new Date(2000, 0, 1, Number(hour), Number(minute), Number(second))
	const language = locale || 'en-US'
	return new Intl.DateTimeFormat(language, {
		...options,
		numberingSystem: 'latn',
	}).format(date)
}

/** Format an instant as localized relative time without mutating its canonical value. */
export function formatLocaleRelativeTime(
	value: Date | string | number | null | undefined,
	locale: string | null | undefined,
	now: Date | number = Date.now(),
): string {
	if (value === null || value === undefined || value === '') return ''
	const instant = value instanceof Date ? value : new Date(value)
	const reference = now instanceof Date ? now : new Date(now)
	if (Number.isNaN(instant.getTime()) || Number.isNaN(reference.getTime())) return ''
	const delta = (instant.getTime() - reference.getTime()) / 1000
	const absolute = Math.abs(delta)
	const units: Array<[Intl.RelativeTimeFormatUnit, number, number]> = [
		['second', 1, 45],
		['minute', 60, 2700],
		['hour', 3600, 79200],
		['day', 86400, 2246400],
		['month', 2592000, 28512000],
		['year', 31536000, Infinity],
	]
	let unit: Intl.RelativeTimeFormatUnit = 'year'
	let unitSeconds = 31536000
	for (const [candidate, seconds, limit] of units) {
		if (absolute < limit) {
			unit = candidate
			unitSeconds = seconds
			break
		}
	}
	const amount = delta / unitSeconds
	const language = locale || 'en-US'
	const relativeLocale = language.toLowerCase().startsWith('fa')
		? `${language.split('-u-')[0]}-u-nu-latn`
		: language
	return new Intl.RelativeTimeFormat(relativeLocale, { numeric: 'auto', style: 'long' }).format(
		Math.round(amount),
		unit,
	)
}
