import { expect, test } from '../fixtures'
import { INSIGHTS_PATH } from '../helpers/auth'

test.describe('localization', () => {
	test('a date control follows the document locale without changing the saved date format', async ({
		page,
	}) => {
		await page.goto(`${INSIGHTS_PATH}/dashboards`)
		await expect(page.getByText('Settings', { exact: true })).toBeVisible()
		await page.getByText('Settings', { exact: true }).click()
		await page.getByText('General', { exact: true }).click()

		// This changes only the browser document for this isolated test page; it
		// does not write the user's saved language or any site setting.
		await page.evaluate(() => {
			document.documentElement.lang = 'fa-IR'
			document.documentElement.dir = 'rtl'
			document.documentElement.classList.add('fui-vazirmatn')
		})
		await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
		await expect(page.getByText('Fiscal Year Start', { exact: true })).toBeVisible()

		const picker = page.getByRole('button', { name: /Select Date/ })
		await picker.click()
		const calendar = page.getByRole('grid', { name: 'Calendar dates' })
		await expect(calendar).toBeVisible()
		await expect(
			page.getByText(/فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند/),
		).toBeVisible()

		const fontLoaded = await page.evaluate(async () => {
			await document.fonts.load('16px Vazirmatn', 'فارسی')
			return (
				getComputedStyle(document.documentElement).fontFamily.includes('Vazirmatn') &&
				document.fonts.check('16px Vazirmatn', 'فارسی')
			)
		})
		expect(fontLoaded).toBe(true)

		await page.evaluate(() => {
			document.documentElement.lang = 'en-US'
			document.documentElement.dir = 'ltr'
			document.documentElement.classList.remove('fui-vazirmatn')
		})
		await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
		await expect(
			page.getByText(/فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند/),
		).toHaveCount(0)
	})
})
