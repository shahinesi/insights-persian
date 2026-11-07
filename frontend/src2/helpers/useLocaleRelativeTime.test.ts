import { effectScope, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useLocaleRelativeTime } from './useLocaleRelativeTime'

describe('useLocaleRelativeTime', () => {
	afterEach(() => {
		vi.useRealTimers()
	})

	it('formats Persian and English from the same canonical instant and stays reactive', () => {
		const now = new Date('2026-11-07T12:00:00Z')
		vi.useFakeTimers()
		vi.setSystemTime(now)
		const locale = ref<string>('fa-IR')
		const scope = effectScope()
		let relativeTime!: ReturnType<typeof useLocaleRelativeTime>
		scope.run(() => {
			relativeTime = useLocaleRelativeTime('2026-11-07T10:00:00Z', () => locale.value)
		})

		try {
			expect(relativeTime.value).toContain('2')
			expect(relativeTime.value).toContain('پیش')
			expect(relativeTime.value).not.toMatch(/[۰-۹٠-٩]/)

			locale.value = 'en-US'
			expect(relativeTime.value).toBe('2 hours ago')

			vi.setSystemTime(new Date(now.getTime() + 60_000))
			vi.advanceTimersByTime(30_000)
			expect(relativeTime.value).toBe('2 hours ago')
		} finally {
			scope.stop()
		}
	})
})
