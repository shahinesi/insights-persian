import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const chartShare = readFileSync(new URL('./charts/components/ChartShareDialog.vue', import.meta.url), 'utf8')
const dashboardShare = readFileSync(new URL('./dashboard/DashboardShareDialog.vue', import.meta.url), 'utf8')
const faCatalog = readFileSync(new URL('../../insights/locale/fa.po', import.meta.url), 'utf8')

function translationFor(message: string) {
	const entry = new RegExp(`msgid "${message}"\\r?\\nmsgstr "([^"]*)"`).exec(faCatalog)
	return entry?.[1]
}

describe('share dialog tooltip localization', () => {
	// @feature shared.share-tooltip-localization
	it('routes copy tooltip labels through the translation function', () => {
		expect(chartShare).toContain(':text="__(\'Copy Link\')"')
		expect(chartShare).toContain(':text="__(\'Copy iFrame\')"')
		expect(dashboardShare).toContain(':text="__(\'Copy Link\')"')
		expect(dashboardShare).toContain(':text="__(\'Copy Embed\')"')
	})

	// @feature shared.share-tooltip-localization
	it('provides Persian translations for every share tooltip', () => {
		expect(translationFor('Copy Link')).toBe('کپی پیوند')
		expect(translationFor('Copy iFrame')).toBe('کپی کد iframe')
		expect(translationFor('Copy Embed')).toBe('کپی کد جاسازی‌شده')
	})
})
