<template>
	<div class="flex w-[280px] select-none flex-col gap-2 bg-surface-base text-base">
		<div class="flex gap-2">
			<FormControl
				class="min-w-0 flex-1"
				:placeholder="__('Enter date')"
				:model-value="fromDateTxt"
				autocomplete="off"
				@update:modelValue="updateFromDate"
			/>
			<FormControl
				v-if="range"
				class="min-w-0 flex-1"
				:placeholder="__('Enter date')"
				:model-value="toDateTxt"
				autocomplete="off"
				@update:modelValue="updateToDate"
			/>
		</div>
		<div v-if="fromDateTxt || toDateTxt" class="flex justify-end">
			<Button variant="ghost" size="sm" @click="clearDates">{{ __('Clear') }}</Button>
		</div>
		<DateRangeCalendar
			v-if="range"
			:model-value="calendarRange"
			:calendar="calendar"
			today-label=""
			@select="selectCalendarRange"
		/>
		<DateCalendar
			v-else
			:model-value="calendarDate"
			:calendar="calendar"
			today-label=""
			@select="selectCalendarDate"
		/>
		<p v-if="range && description" class="mt-1 text-xs leading-4 text-ink-gray-5">
			{{ description }}
		</p>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DateRangeValue } from 'frappe-ui'
import { DateCalendar, DateRangeCalendar } from 'frappe-ui/experimental'
import session from '../../session'
import { formatLocaleDate } from '../../helpers/locale_format'
import { __ } from '../../translation'
import { formatDatePickerInput, getDatePickerCalendar, parseDatePickerInput } from './date_picker'

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

const locale = () => session.user.locale || 'en-US'
const calendar = computed(() => getDatePickerCalendar(locale()))
const formatInputDate = (isoDate: string) =>
	formatDatePickerInput(isoDate, locale())

const fromDateTxt = ref(formatInputDate(selectedDates.value[0] || ''))
const toDateTxt = ref(formatInputDate(selectedDates.value[1] || ''))

const calendarDate = computed(() => parseDatePickerInput(fromDateTxt.value, locale()) || '')
const calendarRange = computed<DateRangeValue>(() => [
	parseDatePickerInput(fromDateTxt.value, locale()) || '',
	parseDatePickerInput(toDateTxt.value, locale()) || '',
])

function updateFromDate(value: string) {
	fromDateTxt.value = value
	selectDates()
}

function updateToDate(value: string) {
	toDateTxt.value = value
	selectDates()
}

function selectCalendarDate(value: string) {
	fromDateTxt.value = formatInputDate(value)
	toDateTxt.value = ''
	selectDates()
}

function selectCalendarRange(range: DateRangeValue) {
	fromDateTxt.value = formatInputDate(range[0] || '')
	toDateTxt.value = formatInputDate(range[1] || '')
	selectDates()
}

function swapDatesIfNecessary() {
	const fromDate = parseDatePickerInput(fromDateTxt.value, locale())
	const toDate = parseDatePickerInput(toDateTxt.value, locale())
	if (fromDate && toDate && fromDate > toDate) {
		fromDateTxt.value = formatInputDate(toDate)
		toDateTxt.value = formatInputDate(fromDate)
	}
}

function selectDates() {
	if (!props.range) {
		const date = parseDatePickerInput(fromDateTxt.value, locale())
		selectedDates.value = date ? [date] : []
		return
	}

	swapDatesIfNecessary()
	const fromDate = parseDatePickerInput(fromDateTxt.value, locale())
	const toDate = parseDatePickerInput(toDateTxt.value, locale())
	selectedDates.value = fromDate || toDate ? [fromDate || '', toDate || ''] : []
}

function clearDates() {
	fromDateTxt.value = ''
	toDateTxt.value = ''
	selectedDates.value = []
}

const description = computed(() => {
	const fromDate = parseDatePickerInput(fromDateTxt.value, locale())
	const toDate = parseDatePickerInput(toDateTxt.value, locale())
	const format = (date: string, includeYear: boolean) =>
		formatLocaleDate(date, locale(), {
			day: 'numeric',
			month: 'short',
			year: includeYear ? 'numeric' : undefined,
		})

	const fromYear = fromDate
		? formatLocaleDate(fromDate, locale(), { year: 'numeric' })
		: ''
	const toYear = toDate
		? formatLocaleDate(toDate, locale(), { year: 'numeric' })
		: ''
	const includeYear = fromYear !== toYear

	if (fromDate && toDate && fromDate === toDate) {
		return __('Equals: {0}', format(fromDate, true))
	}
	if (fromDate && toDate) {
		return __('Between: {0} and {1}', format(fromDate, includeYear), format(toDate, includeYear))
	}
	if (fromDate) return __('Greater than: {0}', format(fromDate, true))
	if (toDate) return __('Less than: {0}', format(toDate, true))
	return ''
})
</script>
