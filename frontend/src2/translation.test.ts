import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, effect } from 'vue'

vi.mock('frappe-ui', () => ({ createResource: vi.fn() }))

import { createResource } from 'frappe-ui'
import { translationPlugin } from './translation'

describe('Insights translation plugin', () => {
	const originalWindow = globalThis.window

	afterEach(() => {
		vi.clearAllMocks()
		Object.defineProperty(globalThis, 'window', {
			configurable: true,
			value: originalWindow,
			writable: true,
		})
	})

	// @feature settings.translations
	it('installs translated labels and positional placeholders before mount', () => {
		const windowStub = { translatedMessages: { Saved: 'ذخیره شد', 'Hello {0}': 'سلام {0}' } }
		Object.defineProperty(globalThis, 'window', {
			configurable: true,
			value: windowStub,
			writable: true,
		})
		const app = createApp({})

		app.use(translationPlugin)

		expect(app.config.globalProperties.__('Saved')).toBe('ذخیره شد')
		expect(app.config.globalProperties.__('Hello {0}', 'دوست')).toBe('سلام دوست')
	})

	it('rerenders labels when the asynchronous translation resource arrives', () => {
		const windowStub: Record<string, any> = {}
		Object.defineProperty(globalThis, 'window', {
			configurable: true,
			value: windowStub,
			writable: true,
		})
		const app = createApp({})

		app.use(translationPlugin)

		let renderedLabel = ''
		effect(() => {
			renderedLabel = app.config.globalProperties.__('No data')
		})
		expect(renderedLabel).toBe('No data')

		const options = vi.mocked(createResource).mock.calls[0][0] as any
		options.transform({ 'No data': 'داده‌ای موجود نیست' })

		expect(renderedLabel).toBe('داده‌ای موجود نیست')
		expect(windowStub.translatedMessages['No data']).toBe('داده‌ای موجود نیست')
	})
})
