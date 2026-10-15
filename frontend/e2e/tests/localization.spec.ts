import { randomUUID } from 'node:crypto'
import { expect, test } from '../fixtures'
import { INSIGHTS_PATH, login, type Credentials } from '../helpers/auth'
import { createQuery, deleteTeam, shareWorkbook, uniqueTitle } from '../helpers/insights'

const PERSIAN_MONTHS = /فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند/

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
			// The frozen browser date is 2026-10-15 (Mehr 1405), whose Persian
			// calendar month maps to Gregorian ISO 2026-09-23 through 2026-10-22.
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
				.toContain('2026-09-23')
			const monthPresetQuery = await adminApi.getDoc<{ operations: unknown }>(
				'Insights Query v3',
				query.name,
			)
			const monthPresetOperations = JSON.stringify(monthPresetQuery.operations)
			expect(monthPresetOperations).toContain('between')
			expect(monthPresetOperations).toContain('2026-09-23')
			expect(monthPresetOperations).toContain('2026-10-22')
			expect(monthPresetOperations).not.toContain('۱۴۰۵')

			await dateColumn.locator('button').last().click()
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
						query.name,
					)
					return JSON.stringify(savedQuery.operations)
				})
				.toContain('2027-01-01')
			const savedQuery = await adminApi.getDoc<{ operations: unknown }>(
				'Insights Query v3',
				query.name,
			)
			const operations = JSON.stringify(savedQuery.operations)
			expect(operations).toContain('order_purchase_timestamp')
			expect(operations).toContain('2027-01-01')
			expect(operations).not.toContain('۱۴۰۵')

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

			const englishDateColumn = page.locator(
				'td[data-column-name="order_purchase_timestamp"]',
			)
			await englishDateColumn.locator('button').last().click()
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
