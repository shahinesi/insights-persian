import { randomUUID } from 'node:crypto'
import { expect, test } from '../fixtures'
import { INSIGHTS_PATH, login, type Credentials } from '../helpers/auth'
import {
	createChart,
	createDashboard,
	createQuery,
	deleteTeam,
	shareWorkbook,
	uniqueTitle,
} from '../helpers/insights'

const PERSIAN_MONTHS = /فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند/
const ENGLISH_MONTH_YEAR =
	/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/

test.describe('localization', () => {
	test('a saved Persian locale displays Jalali dates and stores the selected ISO date', async ({
		page,
		adminApi,
		workbookWithQuery,
	}, testInfo) => {
		const { workbook, query } = workbookWithQuery
		const email = `e2e-localization-${randomUUID()}@example.com`
		const password = `E2e-${randomUUID()}!`
		const teamName = uniqueTitle('Localization')
		const user = await adminApi.createDoc<{ name: string }>('User', {
			email,
			first_name: 'E2E',
			last_name: 'Localization',
			user_type: 'Website User',
			enabled: 1,
			send_welcome_email: 0,
			new_password: password,
			language: 'fa',
			roles: [{ role: 'Insights User' }],
		})

		try {
			const team = await adminApi.callMethod<{ name: string }>(
				'insights.api.user.create_team',
				{ team_name: teamName },
			)
			await adminApi.callMethod('insights.api.user.update_team', {
				team: {
					name: team.name,
					team_name: teamName,
					team_members: [{ user: email }],
					team_permissions: [
						{
							resource_type: 'Insights Data Source v3',
							resource_name: 'demo_data',
							table_restrictions: '',
						},
					],
				},
			})
			const savedTeam = await adminApi.getDoc<{
				team_members: Array<{ user: string }>
				team_permissions: Array<{ resource_type: string; resource_name: string }>
			}>('Insights Team', team.name)
			expect(savedTeam.team_members.map(({ user: member }) => member)).toContain(email)
			expect(savedTeam.team_permissions).toContainEqual(
				expect.objectContaining({
					resource_type: 'Insights Data Source v3',
					resource_name: 'demo_data',
				}),
			)

			await shareWorkbook(adminApi, workbook.name, [{ user: email, access: 'edit' }])
			const savedUser = await adminApi.getDoc<{ language: string }>('User', user.name)
			expect(savedUser.language).toBe('fa')

			const credentials: Credentials = { usr: email, pwd: password }
			await login(page, credentials)
			// Keep the relative-period preset deterministic without changing the site
			// clock or any shared User/locale setting.
			await page.clock.install({ time: new Date('2026-10-15T12:00:00.000Z') })
			await page.goto(`${INSIGHTS_PATH}/workbook/${workbook.name}/query/${query.name}`)

			const localeResponse = await page.request.get('/api/method/insights.api.get_user_info')
			expect(localeResponse.ok()).toBe(true)
			expect((await localeResponse.json()).message.locale).toBe('fa')
			await expect(page.locator('html')).toHaveAttribute('lang', 'fa')
			await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
			await expect(page.locator('html')).toHaveClass(/fui-vazirmatn/)
			await expect(page.getByRole('cell', { name: 'order_purchase_timestamp' })).toBeVisible()

			// The header contains unlabeled type and menu buttons; the last button opens its column menu.
			const dateColumn = page.locator('td[data-column-name="order_purchase_timestamp"]')
			await dateColumn.locator('button').last().click()
			await page.getByRole('button', { name: 'Filter' }).click()

			// Select the Persian "This Month" preset through the real filter UI.
			// The preset remains relative in the saved query; calendar_context resolves
			// its current Persian month to Gregorian ISO bounds at execution time.
			await page.getByText('این ماه', { exact: true }).click()
			const presetPopover = page.locator('[data-reka-popper-content-wrapper]').filter({
				has: page.getByText('این ماه', { exact: true }),
			})
			await presetPopover.locator('button:has(.lucide-check)').click()

			await expect
				.poll(async () => {
					const savedQuery = await adminApi.getDoc<{ operations: unknown }>(
						'Insights Query v3',
						query.name,
					)
					return JSON.stringify(savedQuery.operations)
				})
				.toContain('Current Month')
			const monthPresetQuery = await adminApi.getDoc<{ operations: unknown }>(
				'Insights Query v3',
				query.name,
			)
			const monthPresetOperations = JSON.stringify(monthPresetQuery.operations)
			expect(monthPresetOperations).toContain('within')
			expect(monthPresetOperations).toContain('Current Month')
			expect(monthPresetOperations).not.toContain('2026-09-23')
			expect(monthPresetOperations).not.toContain('2026-10-22')
			expect(monthPresetOperations).not.toContain('۱۴۰۵')

			// The selected month has no demo rows. Start a fresh query before opening
			// another column menu, matching the actual empty-result UI behavior.
			const persianDateQuery = await createQuery(adminApi, { workbook: workbook.name })
			await page.goto(
				`${INSIGHTS_PATH}/workbook/${workbook.name}/query/${persianDateQuery.name}`,
			)
			await expect(page.getByRole('cell', { name: 'order_purchase_timestamp' })).toBeVisible()
			const persianDateColumn = page.locator(
				'td[data-column-name="order_purchase_timestamp"]',
			)
			await persianDateColumn.locator('button').last().click()
			await page.getByRole('button', { name: 'Filter' }).click()
			await page.getByText('تاریخ‌های مشخص', { exact: true }).click()

			const fromDate = page.getByRole('combobox', { name: /^(From|از)$/ })
			await fromDate.click()
			const calendar = page.getByRole('grid', { name: 'Calendar dates' })
			await expect(calendar).toBeVisible()
			await expect(page.getByText(PERSIAN_MONTHS).first()).toBeVisible()

			await page.getByRole('button', { name: 'cycle-calendar-view' }).click()
			const yearList = page.getByRole('listbox', { name: 'Select year' })
			await yearList.getByRole('button', { name: /1405|۱۴۰۵/ }).click()
			const monthList = page.getByRole('listbox', { name: 'Select month' })
			await monthList.getByRole('button', { name: 'دی', exact: true }).click()

			// data-value is the DatePicker's public canonical Gregorian date contract;
			// the visible label and calendar navigation above exercise its Persian presentation.
			const selectedDate = calendar.locator('[data-value="2027-01-01"]')
			await expect(selectedDate).toBeVisible()
			await testInfo.attach('insights-persian-jalali-date-picker', {
				body: await page.screenshot({ type: 'png', fullPage: true }),
				contentType: 'image/png',
			})
			await selectedDate.click()

			const filterPopover = page.locator('[data-reka-popper-content-wrapper]').filter({
				has: page.getByText('تاریخ‌های مشخص', { exact: true }),
			})
			// The apply control is icon-only; the Lucide class is its only stable selector.
			await filterPopover.locator('button:has(.lucide-check)').click()

			await expect
				.poll(async () => {
					const savedQuery = await adminApi.getDoc<{ operations: unknown }>(
						'Insights Query v3',
						persianDateQuery.name,
					)
					return JSON.stringify(savedQuery.operations)
				})
				.toContain('2027-01-01')
			const savedQuery = await adminApi.getDoc<{ operations: unknown }>(
				'Insights Query v3',
				persianDateQuery.name,
			)
			const operations = JSON.stringify(savedQuery.operations)
			expect(operations).toContain('order_purchase_timestamp')
			expect(operations).toContain('2027-01-01')
			expect(operations).not.toContain('۱۴۰۵')

			const chartQuery = await createQuery(adminApi, { workbook: workbook.name })
			const dateChart = await createChart(adminApi, {
				workbook: workbook.name,
				query: chartQuery.name,
				config: {
					x_axis: {
						dimension: {
							dimension_name: 'order_purchase_timestamp',
							column_name: 'order_purchase_timestamp',
							data_type: 'Datetime',
							granularity: 'month',
						},
					},
					y_axis: {
						series: [
							{
								measure: {
									measure_name: 'count_of_rows',
									column_name: 'count',
									data_type: 'Integer',
									aggregation: 'count',
								},
							},
						],
					},
				},
			})
			await page.goto(`${INSIGHTS_PATH}/workbook/${workbook.name}/chart/${dateChart.name}`)
			await expect(page.locator('html')).toHaveAttribute('lang', 'fa')
			const chart = page.locator('[_echarts_instance_]')
			const chartSvg = chart.locator('svg')
			await expect(chartSvg).toBeVisible()
			await expect(chartSvg.getByText('دی ۱۳۹۵', { exact: true })).toBeVisible()
			await testInfo.attach('insights-persian-date-chart', {
				body: await page.screenshot({ type: 'png', fullPage: true }),
				contentType: 'image/png',
			})

			const dashboard = await createDashboard(adminApi, {
				workbook: workbook.name,
				charts: [dateChart.name],
			})
			await page.goto(
				`${INSIGHTS_PATH}/workbook/${workbook.name}/dashboard/${dashboard.name}`,
			)
			await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
			await expect(page.locator('[_echarts_instance_] svg')).toBeVisible()
			await testInfo.attach('insights-persian-dashboard-chart', {
				body: await page.screenshot({ type: 'png', fullPage: true }),
				contentType: 'image/png',
			})

			await adminApi.updateDoc('User', user.name, { language: 'en' })
			await expect
				.poll(
					async () =>
						(await adminApi.getDoc<{ language: string }>('User', user.name)).language,
				)
				.toBe('en')
			await page.reload()
			const englishLocaleResponse = await page.request.get(
				'/api/method/insights.api.get_user_info',
			)
			expect((await englishLocaleResponse.json()).message.locale).toBe('en')
			await expect(page.locator('html')).toHaveAttribute('lang', 'en')
			await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
			await expect(page.locator('html')).not.toHaveClass(/fui-vazirmatn/)
			await page.goto(`${INSIGHTS_PATH}/workbook/${workbook.name}/chart/${dateChart.name}`)
			await expect(page.locator('html')).toHaveAttribute('lang', 'en')
			const englishChart = page.locator('[_echarts_instance_] svg')
			await expect(englishChart).toBeVisible()
			await expect(englishChart.getByText(ENGLISH_MONTH_YEAR).first()).toBeVisible()
			await expect(englishChart.getByText(PERSIAN_MONTHS).first()).toHaveCount(0)
			await testInfo.attach('insights-english-date-chart', {
				body: await page.screenshot({ type: 'png', fullPage: true }),
				contentType: 'image/png',
			})

			// The applied date has no demo rows, so use a fresh query in the same workbook
			// to reopen the filter through the real UI after the persisted locale changes.
			const englishQuery = await createQuery(adminApi, { workbook: workbook.name })
			await page.goto(`${INSIGHTS_PATH}/workbook/${workbook.name}/query/${englishQuery.name}`)
			await expect(page.getByRole('cell', { name: 'order_purchase_timestamp' })).toBeVisible()
			const englishDateColumn = page.locator(
				'td[data-column-name="order_purchase_timestamp"]',
			)
			await englishDateColumn.locator('button').last().click()
			await page.getByRole('button', { name: 'Filter' }).click()
			await page.getByText('Specific Dates', { exact: true }).click()
			await page.getByRole('combobox', { name: /^(From|از)$/ }).click()
			await expect(page.getByRole('grid', { name: 'Calendar dates' })).toBeVisible()
			await expect(page.getByText(PERSIAN_MONTHS).first()).toHaveCount(0)
			const currentEnglishMonth = await page.evaluate(() =>
				new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date()),
			)
			await expect(page.getByRole('button', { name: 'cycle-calendar-view' })).toContainText(
				currentEnglishMonth,
			)
			// Close the nested date-picker and its filter popover before opening the
			// column menu again; otherwise the still-open calendar intercepts the click.
			await page.keyboard.press('Escape')
			await expect(page.getByRole('grid', { name: 'Calendar dates' })).toBeHidden()
			await page.keyboard.press('Escape')
			await expect(page.getByRole('button', { name: 'Filter' })).toHaveAttribute(
				'aria-expanded',
				'false',
			)
			await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible()
			await page.getByRole('button', { name: 'Filter' }).click()
			await page.getByText('This Month', { exact: true }).click()
			const englishPresetPopover = page
				.locator('[data-reka-popper-content-wrapper]')
				.filter({ has: page.getByText('This Month', { exact: true }) })
			await englishPresetPopover.locator('button:has(.lucide-check)').click()
			await expect
				.poll(async () => {
					const savedQuery = await adminApi.getDoc<{ operations: unknown }>(
						'Insights Query v3',
						englishQuery.name,
					)
					return JSON.stringify(savedQuery.operations)
				})
				.toContain('Current Month')
			const englishPresetQuery = await adminApi.getDoc<{ operations: unknown }>(
				'Insights Query v3',
				englishQuery.name,
			)
			const englishPresetOperations = JSON.stringify(englishPresetQuery.operations)
			expect(englishPresetOperations).toContain('within')
			expect(englishPresetOperations).toContain('Current Month')
			expect(englishPresetOperations).not.toContain('2026-09-23')
		} finally {
			await deleteTeam(adminApi, teamName)
			await adminApi.deleteDoc('User', user.name).catch(() => {})
		}
	})
})
