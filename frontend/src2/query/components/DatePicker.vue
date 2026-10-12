<template>
	<div class="flex w-[210px] select-none flex-col gap-2 bg-surface-base text-base">
		<div class="flex items-center justify-between text-ink-gray-6">
			<Button @click="prevMonth" icon="lucide-chevron-left" />
			<Button @dblclick="clearDates"> {{ calendarTitle }} </Button>
			<Button @click="nextMonth" icon="lucide-chevron-right" />
		</div>
		<div class="flex gap-2">
			<FormControl
				class="flex-1"
				placeholder="Enter date"
				v-model="fromDateTxt"
				autocomplete="off"
				@update:modelValue="selectDates(), selectCurrentMonthYear()"
			></FormControl>
			<FormControl
				v-if="range"
				class="flex-1"
				placeholder="Enter date"
				v-model="toDateTxt"
				autocomplete="off"
				@update:modelValue="selectDates(), selectCurrentMonthYear()"
			></FormControl>
		</div>
		<div class="tnum flex flex-col items-center justify-center text-base">
			<div class="grid w-full grid-cols-7">
				<div
					v-for="(day, i) in calendar.weekdayLabels"
					:key="i"
					class="flex h-[30px] w-[30px] items-center justify-center text-sm text-ink-gray-5"
				>
					{{ day }}
				</div>
				<template v-for="(week, i) in calendar.weeks" :key="i">
					<div
						v-for="date in week"
						:key="date.isoDate"
						class="flex h-[30px] w-[30px] cursor-pointer items-center justify-center text-sm"
						:class="{
							'font-bold': date.isoDate === todayISO,
							'opacity-50': !date.isCurrentMonth,
							' rounded-l-4 bg-surface-gray-5 !font-medium':
								fromDateTxt && date.isoDate === fromDateTxt,
							' rounded-r-4 bg-surface-gray-5 !font-medium':
								toDateTxt && date.isoDate === toDateTxt,
							'bg-surface-gray-2 font-medium text-ink-gray-7': isInRange(date),
						}"
						@click="() => handleDateClick(date.isoDate)"
					>
						{{ date.dayLabel }}
					</div>
				</template>
			</div>
			<p v-if="range" class="mt-1 text-xs leading-4 text-ink-gray-5">
				{{ description }}
			</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import {
	formatLocaleDate,
	getPersianCalendarMonth,
	getPersianDateFromISO,
	getISODateFromPersianDate,
	useDocumentLocale,
} from 'frappe-ui/localization'

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

const today = new Date()
const todayISO = toValue(today)
const locale = useDocumentLocale().locale
const viewDateISO = ref(todayISO)
const fromDateTxt = ref<string>(selectedDates.value[0] || '')
const toDateTxt = ref<string>(selectedDates.value[1] || '')

onBeforeMount(() => {
	selectCurrentMonthYear()
})

function selectCurrentMonthYear() {
	const selected = toDateTxt.value || fromDateTxt.value || todayISO
	if (isValidISODate(selected)) viewDateISO.value = selected
}

function isValidISODate(value: string) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
	if (!match) return false
	const [, year, month, day] = match.map(Number)
	const date = new Date(Date.UTC(year, month - 1, day))
	return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function toISODate(date: Date) {
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

const isPersian = computed(() => locale.value.toLowerCase().split(/[-_]/, 1)[0] === 'fa')
const calendar = computed(() => {
	if (isPersian.value) {
		const persian = getPersianDateFromISO(viewDateISO.value)
		return getPersianCalendarMonth(persian.year, persian.month, locale.value)
	}

	const [year, month] = viewDateISO.value.split('-').map(Number)
	const first = new Date(Date.UTC(year, month - 1, 1))
	const gridStart = new Date(Date.UTC(year, month - 1, 1 - first.getUTCDay()))
	const number = new Intl.NumberFormat(locale.value, { useGrouping: false })
	const weekdays = Array.from({ length: 7 }, (_, index) =>
		new Intl.DateTimeFormat(locale.value, { weekday: 'short', timeZone: 'UTC' }).format(
			new Date(Date.UTC(2025, 0, 5 + index)),
		),
	)
	const cells = Array.from({ length: 42 }, (_, index) => {
		const date = new Date(gridStart.getTime() + index * 86400000)
		const isoDate = toISODate(date)
		return {
			isoDate,
			dayLabel: number.format(date.getUTCDate()),
			weekday: date.getUTCDay(),
			isCurrentMonth: date.getUTCMonth() === month - 1 && date.getUTCFullYear() === year,
		}
	})
	const monthLabel = new Intl.DateTimeFormat(locale.value, {
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC',
	}).format(first)
	return {
		monthName: monthLabel,
		yearLabel: '',
		weekdayLabels: weekdays,
		weeks: Array.from({ length: 6 }, (_, index) => cells.slice(index * 7, index * 7 + 7)),
	}
})

const calendarTitle = computed(() =>
	[calendar.value.monthName, calendar.value.yearLabel].filter(Boolean).join(' '),
)

function formatDate(isoDate: string, options: { year?: boolean } = {}) {
	return formatLocaleDate(isoDate, {
		calendar: isPersian.value ? 'persian' : 'gregory',
		day: 'numeric',
		month: 'short',
		year: options.year ? 'numeric' : undefined,
	})
}

function handleDateClick(isoDate: string) {
	if (!props.range) {
		fromDateTxt.value = isoDate
		selectDates()
		return
	}
	if (fromDateTxt.value && toDateTxt.value) {
		fromDateTxt.value = isoDate
		toDateTxt.value = ''
	} else if (fromDateTxt.value && !toDateTxt.value) {
		toDateTxt.value = isoDate
	} else {
		fromDateTxt.value = isoDate
	}
	swapDatesIfNecessary()
	selectDates()
}

function swapDatesIfNecessary() {
	if (!fromDateTxt.value || !toDateTxt.value) {
		return
	}
	if (fromDateTxt.value > toDateTxt.value) {
		const temp = fromDateTxt.value
		fromDateTxt.value = toDateTxt.value
		toDateTxt.value = temp
	}
}

function selectDates() {
	if (!props.range) {
		selectedDates.value = [fromDateTxt.value]
		return
	}
	if (!fromDateTxt.value && !toDateTxt.value) {
		selectedDates.value = []
		return
	}
	selectedDates.value = [fromDateTxt.value, toDateTxt.value]
}

function prevMonth() {
	changeMonth(-1)
}

function nextMonth() {
	changeMonth(1)
}

function changeMonth(adder: number) {
	if (isPersian.value) {
		const current = getPersianDateFromISO(viewDateISO.value)
		let year = current.year
		let month = current.month + adder
		if (month < 1) { month = 12; year-- }
		if (month > 12) { month = 1; year++ }
		viewDateISO.value = getISODateFromPersianDate({ year, month, day: 1 })
		return
	}
	const [year, month] = viewDateISO.value.split('-').map(Number)
	const date = new Date(Date.UTC(year, month - 1 + adder, 1))
	viewDateISO.value = toISODate(date)
}

function isInRange(date: { isoDate: string }) {
	if (!fromDateTxt.value || !toDateTxt.value) {
		return false
	}
	return date.isoDate >= fromDateTxt.value && date.isoDate <= toDateTxt.value
}

function clearDates() {
	fromDateTxt.value = ''
	toDateTxt.value = ''
	selectCurrentMonthYear()
	selectDates()
}

// Converts today's local calendar date to the same ISO shape used by the API.
function toValue(date: Date | string) {
	if (!date) {
		return ''
	}
	if (typeof date === 'string') {
		return date
	}

	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

const description = computed(() => {
	const fromDateYear = fromDateTxt.value
		? isValidISODate(fromDateTxt.value)
			? isPersian.value
				? getPersianDateFromISO(fromDateTxt.value).year
				: Number(fromDateTxt.value.slice(0, 4))
			: undefined
		: undefined
	const toDateYear = toDateTxt.value
		? isValidISODate(toDateTxt.value)
			? isPersian.value
				? getPersianDateFromISO(toDateTxt.value).year
				: Number(toDateTxt.value.slice(0, 4))
			: undefined
		: undefined
	const formatted = (date: string) => formatDate(date, { year: fromDateYear !== toDateYear })
	if (fromDateTxt.value && toDateTxt.value && fromDateTxt.value === toDateTxt.value) {
		return `Equals: ${formatted(fromDateTxt.value)}`
	}
	if (fromDateTxt.value && toDateTxt.value) {
		return `Between: ${formatted(fromDateTxt.value)} and ${formatted(toDateTxt.value)}`
	}
	if (fromDateTxt.value) return `Greater than: ${formatted(fromDateTxt.value)}`
	if (toDateTxt.value) return `Less than: ${formatted(toDateTxt.value)}`
	return ''
})
</script>
