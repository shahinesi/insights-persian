<script setup lang="ts">
import { Calendar } from 'lucide-vue-next'
import { computed } from 'vue'
import DatePicker from './DatePicker.vue'
import session from '../../session'
import { formatLocaleDate } from '../../helpers/locale_format'
import { isPersianLocale } from '../../helpers/locale'

const props = defineProps({
	placeholder: {
		type: String,
		default: 'Select Date',
	},
	range: {
		type: Boolean,
		default: false,
	},
})
const dates = defineModel<string[]>({
	default: () => [],
	required: true,
})

const formatDate = (dates: string | string[] | Date | Date[]) => {
	const _dates: (string | Date)[] = []
	if (typeof dates === 'string') {
		_dates.push(dates)
	} else if (Array.isArray(dates) && dates.every((date) => typeof date === 'string')) {
		_dates.push(dates[0])
		if (dates[1]) _dates.push(dates[1])
	} else if (dates instanceof Date) {
		_dates.push(dates)
	} else if (Array.isArray(dates) && dates.every((date) => date instanceof Date)) {
		_dates.push(dates[0] as Date)
		if (dates[1]) _dates.push(dates[1] as Date)
	}

	const [start, end] = _dates
	if (!start) return ''
	const locale = session.user.locale || 'en-US'
	const year = (date: string | Date) =>
		formatLocaleDate(date, locale, { year: 'numeric' })
	const currentYear = year(new Date())
	const format = (date: string | Date) =>
		formatLocaleDate(date, locale, {
			month: 'short',
			day: 'numeric',
			...(year(date) === currentYear ? {} : { year: 'numeric' }),
		})
	const separator = isPersianLocale(locale) ? ' – ' : ' - '
	return end ? `${format(start)}${separator}${format(end)}` : format(start)
}

const areAllDatesValid = computed(() => dates.value.length && dates.value.every((date) => date))
const displayDate = computed(() => {
	if (areAllDatesValid.value) {
		return props.range ? formatDate(dates.value) : formatDate(dates.value[0])
	}
	return props.placeholder
})
</script>

<template>
	<Popover side="bottom" align="start" match-trigger-width>
		<template #trigger>
			<Button class="w-full items-center !justify-start overflow-hidden">
				<template #prefix>
					<Calendar class="h-4 w-4 flex-shrink-0 text-ink-gray-5" stroke-width="1.5" />
				</template>
				<span
					class="truncate"
					:class="areAllDatesValid ? 'text-ink-gray-8' : 'text-ink-gray-5'"
				>
					{{ displayDate }}
				</span>
			</Button>
		</template>
		<template #default>
			<div class="flex p-2">
				<DatePicker v-model="dates" :range="props.range"></DatePicker>
			</div>
		</template>
	</Popover>
</template>
