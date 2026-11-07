<script setup lang="ts">
import { call, toast } from 'frappe-ui'
import { __ } from '../translation'
import { ref } from 'vue'
import DatePickerControl from '../query/components/DatePickerControl.vue'
import session from '../session'
import SettingItem from './SettingItem.vue'
import useSettings from './settings'

const settings = useSettings()
settings.load()

const demoLoading = ref(false)

async function setupDemoData() {
	demoLoading.value = true
	try {
		await call('insights.setup.setup_wizard.setup_demo_data')
		session.user.has_demo_data = true
		toast.success(__('Demo Data Ready'), {
			description: __('Sample data and workbook have been set up successfully'),
		})
	} catch {
		toast.error(__('Setup Failed'), {
			description: __('Failed to setup demo data'),
		})
	} finally {
		demoLoading.value = false
	}
}
</script>

<template>
	<div class="flex w-full flex-col gap-6 overflow-y-scroll p-8 px-10">
		<h1 class="text-2xl-semibold">{{ __('General') }}</h1>
		<SettingItem
			:label="__('Logo')"
			:description="__('Appears in the top left corner of the application and in the browser tab next to the page title. Recommended size: 32x32px in PNG format.')"
		>
			<div class="flex h-full w-full items-center justify-center rounded-4 border">
				<img src="../assets/insights-logo-new.svg" :alt="__('Logo')" class="w-8 rounded-4" />
			</div>
		</SettingItem>

		<SettingItem
			:label="__('Fiscal Year Start')"
			:description="__('Set the start of the fiscal year for the organization. This will be used to calculate quarterly and yearly data.')"
		>
			<DatePickerControl
				class="w-28"
				:placeholder="__('Select Date')"
				:model-value="[settings.doc.fiscal_year_start]"
				@update:model-value="settings.doc.fiscal_year_start = $event?.[0] || '2024-04-01'"
			/>
		</SettingItem>

		<SettingItem
			:label="__('Week Starts On')"
			:description="__('Set the start of the week for the organization. This will be used to calculate weekly data.')"
		>
			<FormControl
				class="w-28"
				type="select"
				v-model="settings.doc.week_starts_on"
				:options="[
					{ label: __('Sunday'), value: 'Sunday' },
					{ label: __('Monday'), value: 'Monday' },
					{ label: __('Tuesday'), value: 'Tuesday' },
					{ label: __('Wednesday'), value: 'Wednesday' },
					{ label: __('Thursday'), value: 'Thursday' },
					{ label: __('Friday'), value: 'Friday' },
					{ label: __('Saturday'), value: 'Saturday' },
				]"
			/>
		</SettingItem>

		<SettingItem
			v-if="session.user.is_admin && !session.user.has_demo_data"
			:label="__('Demo Data')"
			:description="__('Set up sample data and a pre-built workbook to explore Insights features.')"
		>
			<Button
				variant="subtle"
				size="sm"
				:label="__('Setup Demo Data')"
				:loading="demoLoading"
				@click="setupDemoData"
			/>
		</SettingItem>

		<div class="flex justify-end">
			<Button
				:label="__('Update')"
				variant="solid"
				:disabled="!settings.isdirty"
				:loading="settings.saving"
				@click="() => settings.save()"
			/>
		</div>
	</div>
</template>
