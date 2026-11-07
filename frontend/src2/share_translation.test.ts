import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const chartShare = readFileSync(new URL('./charts/components/ChartShareDialog.vue', import.meta.url), 'utf8')
const dashboardShare = readFileSync(new URL('./dashboard/DashboardShareDialog.vue', import.meta.url), 'utf8')
const demoBanner = readFileSync(new URL('./components/DemoDataBanner.vue', import.meta.url), 'utf8')
const generalSettings = readFileSync(new URL('./settings/GeneralSettings.vue', import.meta.url), 'utf8')
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

describe('demo and general settings localization', () => {
	const settingsTranslations: Record<string, string> = {
		Logo: 'نشان',
		'Appears in the top left corner of the application and in the browser tab next to the page title. Recommended size: 32x32px in PNG format.':
			'در گوشهٔ بالای سمت چپ برنامه و کنار عنوان صفحه در زبانهٔ مرورگر نمایش داده می‌شود. اندازهٔ پیشنهادی: 32×32 پیکسل با قالب PNG.',
		'Set the start of the fiscal year for the organization. This will be used to calculate quarterly and yearly data.':
			'شروع سال مالی سازمان را تعیین می‌کند و برای محاسبهٔ داده‌های فصلی و سالانه استفاده می‌شود.',
		'Select Date': 'انتخاب تاریخ',
		'Set the start of the week for the organization. This will be used to calculate weekly data.':
			'روز آغاز هفتهٔ سازمان را تعیین می‌کند و برای محاسبهٔ داده‌های هفتگی به کار می‌رود.',
		'Demo Data': 'داده‌های آزمایشی',
		'Set up sample data and a pre-built workbook to explore Insights features.':
			'داده‌های نمونه و یک کتاب کار آماده را راه‌اندازی کنید تا قابلیت‌های Insights را بررسی کنید.',
		Update: 'به‌روزرسانی',
	}

	// @feature settings.demo-data-localization
	it('routes visible demo banner and settings text through gettext', () => {
		expect(demoBanner).toContain("__('Explore with sample data and a pre-built workbook')")
		for (const message of Object.keys(settingsTranslations)) {
			expect(generalSettings).toContain(`__('${message}')`)
		}
		for (const day of ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) {
			expect(generalSettings).toContain(`{ label: __('${day}'), value: '${day}' }`)
		}
	})

	// @feature settings.demo-data-localization
	it('provides natural Persian catalog entries for demo copy', () => {
		expect(translationFor('Explore with sample data and a pre-built workbook')).toBe(
			'با داده‌های نمونه و یک کتاب کار آماده، قابلیت‌های Insights را بررسی کنید',
		)
		expect(translationFor('Set up sample data and a pre-built workbook to explore Insights features.')).toBe(
			settingsTranslations['Set up sample data and a pre-built workbook to explore Insights features.'],
		)
		for (const [message, translation] of Object.entries(settingsTranslations)) {
			expect(translationFor(message), message).toBe(translation)
		}
	})
})
