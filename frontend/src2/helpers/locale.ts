/** Recognize Persian locale identifiers using BCP 47 or legacy separators. */
export function isPersianLocale(locale?: string | null): boolean {
	return /^fa(?:[-_]|$)/i.test(locale || '')
}

/** Intl APIs accept BCP 47 separators; Frappe may provide legacy underscores. */
export function toIntlLocale(locale?: string | null, fallback = 'en-US'): string {
	return (locale || fallback).replace(/_/g, '-')
}
