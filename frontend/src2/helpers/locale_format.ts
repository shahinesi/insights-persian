/** Format display values with the locale the current Frappe user selected. */
export function formatLocaleDate(
	value: Date | string | number | null | undefined,
	locale: string | null | undefined,
	options: Intl.DateTimeFormatOptions = {},
): string {
	if (value === null || value === undefined || value === '') return ''
	const language = locale || 'en-US'
	const isPersian = language.toLowerCase().startsWith('fa')
	const hasTime = options.hour !== undefined || options.minute !== undefined || options.second !== undefined
	let date: Date
	let dateOnly = false

	if (value instanceof Date) {
		if (Number.isNaN(value.getTime())) return ''
		dateOnly = !hasTime
		date = dateOnly
			? new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()))
			: value
	} else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
		const [year, month, day] = value.split('-').map(Number)
		date = new Date(Date.UTC(year, month - 1, day))
		if (
			date.getUTCFullYear() !== year ||
			date.getUTCMonth() !== month - 1 ||
			date.getUTCDate() !== day
		) return ''
		dateOnly = true
	} else {
		date = new Date(
			typeof value === 'string' ? value.replace(' ', 'T') : value,
		)
		if (Number.isNaN(date.getTime())) return ''
	}

	const formatOptions: Intl.DateTimeFormatOptions = {
		...options,
		...(isPersian ? { calendar: 'persian', numberingSystem: 'arabext' } : {}),
		...((dateOnly && !hasTime) ? { timeZone: 'UTC' } : {}),
	}
	return new Intl.DateTimeFormat(language, formatOptions).format(date)
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
	return new Intl.NumberFormat(locale || 'en-US', options).format(value)
}

export function directionForLocale(locale: string | null | undefined): 'ltr' | 'rtl' {
	const language = (locale || 'en').toLowerCase().split(/[-_]/, 1)[0]
	return ['ar', 'ckb', 'dv', 'fa', 'he', 'ps', 'ur', 'yi'].includes(language)
		? 'rtl'
		: 'ltr'
}

export function parseLocaleNumber(value: string): number | undefined {
	const normalized = value
		.trim()
		.replace(/[۰-۹٠-٩]/g, (digit) => {
			const code = digit.charCodeAt(0)
			return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660)
		})
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
	const isPersian = language.toLowerCase().startsWith('fa')
	return new Intl.DateTimeFormat(language, {
		...options,
		...(isPersian ? { numberingSystem: 'arabext' } : {}),
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
		['second', 1, 45], ['minute', 60, 2700], ['hour', 3600, 79200],
		['day', 86400, 2246400], ['month', 2592000, 28512000],
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
	return new Intl.RelativeTimeFormat(locale || 'en-US', { numeric: 'auto', style: 'long' })
		.format(Math.round(amount), unit)
}
