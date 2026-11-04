<script setup lang="ts">
import { computed } from 'vue'
import { formatLocaleDate } from 'frappe-ui/localization'
import session from '../session'
import { isPersianLocale } from '../helpers/locale'
import HomeQuickActions from './HomeQuickActions.vue'
import HomeWorkbookList from './HomeWorkbookList.vue'

const today = computed(() => {
	const locale = session.user.locale || 'en-US'
	return formatLocaleDate(
		new Date(),
		{
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			...(isPersianLocale(locale) ? { timeZone: 'Asia/Tehran' } : {}),
		},
		locale,
	)
})
</script>

<template>
	<div class="flex flex-1 flex-col space-y-8 overflow-hidden bg-surface-base p-6">
		<div class="space-y-2">
			<div class="text-4xl-bold text-ink-gray-8">{{ __('Hello, {0} 👋', session.user.first_name) }}</div>
			<div class="text-lg text-ink-gray-5">{{ today }}</div>
		</div>
		<HomeQuickActions></HomeQuickActions>
		<HomeWorkbookList></HomeWorkbookList>
	</div>
</template>
