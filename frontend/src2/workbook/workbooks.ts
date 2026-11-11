import { call, toast } from 'frappe-ui'
import { reactive, ref } from 'vue'
import { confirmDialog } from '../helpers/confirm_dialog'
import { useLocaleRelativeTime } from '../helpers/useLocaleRelativeTime'
import router from '../router'
import { __ } from '../translation'
import type { FilterCondition, WireFilters } from '@framework/ui/Filter'
import type { AccessSource } from '../components/access'
import { WorkbookListItem } from '../types/workbook.types'
import session from '../session'

const workbooks = ref<WorkbookListItem[]>([])

const loading = ref(false)
// kept here, not in the list view, so they survive opening a workbook and coming back
const filters = ref<FilterCondition[]>([])
async function getWorkbooks(
	search_term?: string,
	limit: number = 100,
	sources: AccessSource[] = ['created', 'shared'],
	filters: WireFilters = [],
) {
	loading.value = true
	const result = await call<WorkbookListItem[]>('insights.api.workbooks.get_workbooks', {
		search_term,
		limit,
		sources,
		filters,
	})
	workbooks.value = result.map((workbook: any) => ({
		...workbook,
		created_from_now: useLocaleRelativeTime(workbook.creation, () => session.user.locale),
		modified_from_now: useLocaleRelativeTime(workbook.modified, () => session.user.locale),
		last_opened_from_now: workbook.last_opened
			? useLocaleRelativeTime(workbook.last_opened, () => session.user.locale)
			: '',
	}))
	loading.value = false
	return workbooks.value
}

function importWorkbook(workbook: any) {
	confirmDialog({
		title: __('Import Workbook'),
		message: __('Are you sure you want to import this workbook?'),
		onSuccess: () => {
			call<{ workbook: string }>('insights.api.workbooks.import_workbook', { workbook }).then(
				(imported: { workbook: string }) => {
					getWorkbooks().then(() => {
						toast.success(__('Workbook imported successfully'))
					})
					router.push(`/workbook/${imported.workbook}`)
				},
			)
		},
	})
}

export default function useWorkbookListItemStore() {
	// the list view drives fetching (with scope); no implicit fetch here,
	// otherwise an unscoped "fetch all" can race with and overwrite it
	return reactive({
		workbooks,
		loading,
		filters,
		getWorkbooks,
		importWorkbook,
	})
}
