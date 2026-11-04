import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'

vi.mock('frappe-ui', () => ({ createResource: vi.fn() }))

import { translationPlugin } from './translation'

describe('Insights translation plugin', () => {
	const originalWindow = globalThis.window

	afterEach(() => {
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
})
