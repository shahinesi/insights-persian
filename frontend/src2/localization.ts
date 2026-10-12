const rightToLeftLanguages = new Set(['ar', 'fa', 'he', 'ps', 'ur', 'yi'])

export function displayLocale(locale: string | undefined, country?: string): string {
	if (country === 'India' && (!locale || /^en(?:-|$)/i.test(locale))) return 'en-IN'
	return locale || 'en-US'
}

export function directionForLocale(locale: string): 'ltr' | 'rtl' {
	const language = locale.trim().toLowerCase().split(/[-_]/, 1)[0]
	return rightToLeftLanguages.has(language) ? 'rtl' : 'ltr'
}
