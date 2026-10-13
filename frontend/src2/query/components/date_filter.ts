import type { FilterOperator } from '../../types/query.types'

export type SpecificDateFilter = {
	operator: FilterOperator
	value: string[]
}

export function setDateRangeEndpoint(
	current: string[],
	endpoint: 0 | 1,
	value: string,
	range = true,
): string[] {
	const dates = [current[0] || '', current[1] || '']
	dates[endpoint] = value || ''

	if (!range) return dates[0] ? [dates[0]] : []
	if (dates[0] && dates[1] && dates[0] > dates[1]) {
		return [dates[1], dates[0]]
	}
	return dates[0] || dates[1] ? dates : []
}

export function getSpecificDateFilter(value: string[]): SpecificDateFilter {
	if (value[0] === value[1]) return { operator: '=', value }
	if (value[0] && !value[1]) return { operator: '>=', value }
	if (!value[0] && value[1]) return { operator: '<=', value }
	if (value[0] && value[1]) return { operator: 'between', value }
	return { operator: '=', value }
}
