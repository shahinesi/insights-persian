import { describe, expect, it } from 'vitest'
import { getSpecificDateFilter, setDateRangeEndpoint } from './date_filter'

describe('shared date picker consumer adapter', () => {
	it('preserves open-ended ISO date filters', () => {
		expect(setDateRangeEndpoint([], 0, '2027-01-01')).toEqual(['2027-01-01', ''])
		expect(setDateRangeEndpoint([], 1, '2027-01-01')).toEqual(['', '2027-01-01'])
		expect(getSpecificDateFilter(['2027-01-01', ''])).toEqual({
			operator: '>=',
			value: ['2027-01-01', ''],
		})
		expect(getSpecificDateFilter(['', '2027-01-01'])).toEqual({
			operator: '<=',
			value: ['', '2027-01-01'],
		})
	})

	it('orders completed ranges and clears the selected endpoint', () => {
		expect(setDateRangeEndpoint(['2027-01-01', ''], 1, '2026-12-31')).toEqual([
			'2026-12-31',
			'2027-01-01',
		])
		expect(getSpecificDateFilter(['2026-12-31', '2027-01-01'])).toEqual({
			operator: 'between',
			value: ['2026-12-31', '2027-01-01'],
		})
		expect(setDateRangeEndpoint(['2027-01-01', '2027-01-31'], 1, '')).toEqual([
			'2027-01-01',
			'',
		])
		expect(setDateRangeEndpoint(['2027-01-01', ''], 0, '')).toEqual([])
	})

	it('uses one shared picker value without changing Gregorian ISO', () => {
		expect(setDateRangeEndpoint([], 0, '2027-01-01', false)).toEqual(['2027-01-01'])
		expect(setDateRangeEndpoint(['2027-01-01'], 0, '', false)).toEqual([])
	})
})
