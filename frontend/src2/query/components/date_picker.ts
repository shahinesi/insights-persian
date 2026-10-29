import { formatPersianDate, parsePersianDate } from 'frappe-ui/localization'
import { isPersianLocale, toIntlLocale } from '../../helpers/locale'

export function getDatePickerCalendar(locale: string): 'persian' | 'gregorian' {
	return isPersianLocale(locale) ? 'persian' : 'gregorian'
}

export function formatDatePickerInput(isoDate: string, locale: string): string {
	if (!isoDate || !isPersianLocale(locale)) return isoDate
	return formatPersianDate(isoDate, toIntlLocale(locale))
}

export function parseDatePickerInput(value: string, locale: string): string | null {
	const input = value.trim()
	if (!input) return null

	if (isPersianLocale(locale)) {
		const persianDate = parsePersianDate(input, 'YYYY/MM/DD', toIntlLocale(locale))
		if (persianDate) return persianDate
	}

	const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input)
	if (isoDate) {
		const [, year, month, day] = isoDate.map(Number)
		const parsed = new Date(Date.UTC(year, month - 1, day))
		if (
			parsed.getUTCFullYear() === year &&
			parsed.getUTCMonth() === month - 1 &&
			parsed.getUTCDate() === day
		) {
			return input
		}
		return null
	}

	if (isPersianLocale(locale)) return null
	const parsed = new Date(input)
	if (Number.isNaN(parsed.getTime())) return null
	return [
		parsed.getFullYear(),
		String(parsed.getMonth() + 1).padStart(2, '0'),
		String(parsed.getDate()).padStart(2, '0'),
	].join('-')
}
