import { createResource } from 'frappe-ui'
import { shallowRef, type App } from 'vue'

const translatedMessages = shallowRef<Record<string, string>>({})

function getTranslatedMessage(message: string): string {
	// Module-scope option lists call this while they are being defined, so it
	// runs wherever a module is loaded — including a test runner with no window.
	if (typeof window === 'undefined') return message
	return translatedMessages.value[message] || message
}

function translate(message: string): string
function translate(message: string, ...args: string[]): string
function translate(message: string, ...args: string[]): string {
	const translatedMessage = getTranslatedMessage(message)
	if (args.length === 0) {
		return translatedMessage
	}
	return translatedMessage.replace(/{(\d+)}/g, function (match, index) {
		return typeof args[index] != 'undefined' ? args[index] : match
	})
}

export const __ = translate

/**
 * A table of translated strings, built when it is first read rather than when
 * the module defining it loads.
 *
 * Translations arrive asynchronously, so a `const` whose values are `__()` calls
 * is evaluated before any of them and stays English for the session. This reads
 * them at call time and rebuilds when a new set arrives.
 */
export function translatedTable<T>(build: () => T): () => T {
	let messages: unknown
	let table: T | undefined
	return () => {
		// Read the ref so Vue tracks this lookup when it happens inside a
		// computed value or render. This lets tables built before the catalog
		// arrives rebuild when translationPlugin replaces the message table.
		const current = typeof window === 'undefined' ? undefined : translatedMessages.value
		if (table === undefined || messages !== current) {
			messages = current
			table = build()
		}
		return table
	}
}

function fetchTranslations() {
	createResource({
		url: 'insights.api.translations.get_translations',
		method: 'GET',
		cache: 'translations',
		auto: true,
		transform(data: Record<string, string>) {
			const messages = data || {}
			translatedMessages.value = messages
			;(window as any).translatedMessages = messages
		},
	})
}

/**
 * Install this app's `__` for templates.
 *
 * The SPA and every island install it, because a host can bring its own `__`.
 * Desk gives an island `frappe._` through `SetVueGlobals`. That one replaces
 * `{0}` only when it gets an object of replacements. Insights passes arguments
 * positionally, so with desk's `__` the `{0}` would show on the page as is.
 */
export function installTranslate(app: App<Element>) {
	app.config.globalProperties.__ = translate
}

export function translationPlugin(app: App<Element>) {
	installTranslate(app)
	const windowObj = window as any
	windowObj.__ = translate
	translatedMessages.value = windowObj.translatedMessages || {}
	// Desk may prepopulate a global message table before the Insights bundle
	// starts. That table can be partial, so still load Insights' full locale
	// catalog instead of treating any truthy object as complete.
	fetchTranslations()
}

declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		__: typeof translate
	}
}
