<script setup lang="ts">
import { Calendar } from 'lucide-vue-next'
import { computed } from 'vue'
import {
	formatLocaleDate,
	getPersianDateFromISO,
	useDocumentLocale,
} from 'frappe-ui/localization'
import DatePicker from './DatePicker.vue'
import { calendarForLocale } from '../../localization'

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

const locale = useDocumentLocale().locale
const calendar = computed(() => calendarForLocale(locale.value))
const isPersian = computed(() => calendar.value === 'persian')

function asISODate(value: string | Date): string | null {
	if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
	const date = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(date.getTime())) return null
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDisplayDate(value: string | Date, includeYear: boolean) {
	const isoDate = asISODate(value)
	return isoDate
		? formatLocaleDate(isoDate, {
				calendar: isPersian.value ? 'persian' : 'gregory',
				month: 'short',
				day: 'numeric',
				year: includeYear ? 'numeric' : undefined,
			})
		: ''
}

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
	const getCalendarYear = (value: string | Date) => {
		const isoDate = asISODate(value)
		if (!isoDate) return undefined
		return isPersian.value
			? getPersianDateFromISO(isoDate).year
			: Number(isoDate.slice(0, 4))
	}
	const currentYear = getCalendarYear(asISODate(new Date()) || new Date())
	if (!end) return formatDisplayDate(start, getCalendarYear(start) !== currentYear)
	return `${formatDisplayDate(start, getCalendarYear(start) !== currentYear)} - ${formatDisplayDate(end, getCalendarYear(end) !== currentYear)}`
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
