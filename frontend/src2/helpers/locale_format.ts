import { digitsArToFa, digitsFaToEn } from '@persian-tools/persian-tools'
import { isPersianLocale, toIntlLocale } from './locale.ts'

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
	const language = toIntlLocale(locale)
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
	const language = toIntlLocale(locale)
	const relativeLocale = isPersianLocale(language)
		? `${language.split('-u-')[0]}-u-nu-latn`
		: language
	return new Intl.RelativeTimeFormat(relativeLocale, { numeric: 'auto', style: 'long' }).format(
		Math.round(amount),
		unit,
	)
}
