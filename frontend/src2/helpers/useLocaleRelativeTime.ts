import { useTimeAgo } from '@vueuse/core'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { formatLocaleRelativeTime } from './locale_format'

/** Keep VueUse's live clock updates while formatting through the active locale. */
export function useLocaleRelativeTime(
	value: MaybeRefOrGetter<Date | string | number>,
	locale: MaybeRefOrGetter<string | null | undefined>,
) {
	const clock = useTimeAgo(value)
	return computed(() => {
		clock.value
		return formatLocaleRelativeTime(toValue(value), toValue(locale))
	})
}
