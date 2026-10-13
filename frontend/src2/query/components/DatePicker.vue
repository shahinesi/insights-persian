<template>
	<div class="flex w-[210px] flex-col gap-2 bg-surface-base text-base">
		<div class="flex gap-2">
			<SharedDatePicker
				class="min-w-0 flex-1"
				:modelValue="fromDate"
				:calendar="calendar"
				:placeholder="__('From')"
				@update:modelValue="setEndpoint(0, $event)"
			/>
			<SharedDatePicker
				v-if="range"
				class="min-w-0 flex-1"
				:modelValue="toDate"
				:calendar="calendar"
				:placeholder="__('To')"
				@update:modelValue="setEndpoint(1, $event)"
			/>
		</div>
		<p v-if="range && description" class="text-xs leading-4 text-ink-gray-5">
			{{ description }}
		</p>
	</div>
</template>

<script setup lang="ts">
import { DatePicker as SharedDatePicker } from 'frappe-ui'
import { computed, ref, watch } from 'vue'
import { formatLocaleDate, useDocumentLocale } from 'frappe-ui/localization'
import { __ } from '../../translation'
import { setDateRangeEndpoint } from './date_filter'

const props = defineProps({
	range: {
		type: Boolean,
		default: true,
	},
})
const selectedDates = defineModel<string[]>({
	type: Array,
	default: () => [],
})

const locale = useDocumentLocale().locale
const isPersian = computed(() => locale.value.toLowerCase().split(/[-_]/, 1)[0] === 'fa')
const calendar = computed(() => (isPersian.value ? 'persian' : 'gregorian'))
const fromDate = ref(selectedDates.value[0] || '')
const toDate = ref(selectedDates.value[1] || '')

watch(
	selectedDates,
	(value) => {
		fromDate.value = value[0] || ''
		toDate.value = value[1] || ''
	},
	{ deep: true },
)

function setEndpoint(index: 0 | 1, value: string) {
	const nextDates = setDateRangeEndpoint(selectedDates.value, index, value, props.range)
	fromDate.value = nextDates[0] || ''
	toDate.value = nextDates[1] || ''
	selectedDates.value = nextDates
}

const description = computed(() => {
	const from = fromDate.value
	const to = toDate.value
	if (!from && !to) return ''
	const fromYear = from ? displayYear(from) : undefined
	const toYear = to ? displayYear(to) : undefined
	const includeYear = fromYear !== toYear
	const formatted = (value: string) =>
		formatLocaleDate(value, {
			calendar: isPersian.value ? 'persian' : 'gregory',
			day: 'numeric',
			month: 'short',
			year: includeYear ? 'numeric' : undefined,
		})

	if (from && to && from === to) return `Equals: ${formatted(from)}`
	if (from && to) return `Between: ${formatted(from)} and ${formatted(to)}`
	if (from) return `Greater than: ${formatted(from)}`
	return `Less than: ${formatted(to)}`
})

function displayYear(isoDate: string) {
	const [year, month, day] = isoDate.split('-').map(Number)
	return new Intl.DateTimeFormat(locale.value, {
		calendar: isPersian.value ? 'persian' : 'gregory',
		year: 'numeric',
		timeZone: 'UTC',
	}).format(new Date(Date.UTC(year, month - 1, day)))
}
</script>
