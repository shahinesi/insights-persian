import { describe, expect, it } from 'vitest'
import {
	currentMonthDateRange,
	getSpecificDateFilter,
	setDateRangeEndpoint,
} from './date_filter'

describe('shared date picker consumer adapter', () => {
	// @feature query.filter-relative-date-persian-month
	it('uses the Persian month boundaries as Gregorian ISO dates for fa-IR', () => {
		expect(currentMonthDateRange('fa-IR', '2026-10-15')).toEqual([
			'2026-09-23',
			'2026-10-22',
		])
	})

	// @feature query.filter-relative-date-persian-month
	it('keeps the English current month Gregorian and ISO', () => {
		expect(currentMonthDateRange('en-US', '2026-10-15')).toEqual([
			'2026-10-01',
			'2026-10-31',
		])
	})

	// @feature query.filter
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

	// @feature query.filter
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

	// @feature query.filter
	it('uses one shared picker value without changing Gregorian ISO', () => {
		expect(setDateRangeEndpoint([], 0, '2027-01-01', false)).toEqual(['2027-01-01'])
		expect(setDateRangeEndpoint(['2027-01-01'], 0, '', false)).toEqual([])
	})
})
