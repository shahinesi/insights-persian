<script setup lang="ts">
import { computed } from 'vue'
import type { SplitBy } from '../../types/chart.types'
import type { Dimension, DimensionOption } from '../../types/query.types'
import CollapsibleSection from './CollapsibleSection.vue'
import NumberInput from '../../components/NumberInput.vue'
import InlineFormControlLabel from '../../components/InlineFormControlLabel.vue'
import DimensionPicker from './DimensionPicker.vue'

const props = defineProps<{
	dimensions: DimensionOption[]
}>()

const splitByModel = defineModel<SplitBy | undefined>({
	required: true,
})

const emptyDimension = (): Dimension => ({
	column_name: '',
	data_type: 'String',
	dimension_name: '',
})

const split_by = computed<SplitBy>({
	get: () => splitByModel.value ?? { dimension: emptyDimension() },
	set: (value) => (splitByModel.value = value),
})

// Nothing is seeded here. Writing the config on mount is one autosave and two
// re-runs of the chart data for opening a chart, and the count the server falls
// back to is the count the input shows as its placeholder.

// TODO: debug why v-model="split_by.dimension" doesn't work
const dimension = computed<Dimension>({
	get: () => split_by.value.dimension ?? emptyDimension(),
	set: (value) => {
		split_by.value = {
			...split_by.value,
			dimension: value,
		}
	},
})

const maxSplitValues = computed({
	get: () => split_by.value.max_split_values,
	set: (value) => (split_by.value = { ...split_by.value, max_split_values: value }),
})
</script>

<template>
	<CollapsibleSection :title="__('Split Series')">
		<div class="flex flex-col gap-3 pt-1">
			<DimensionPicker
				:label="__('Split by')"
				:options="props.dimensions"
				:modelValue="dimension"
				@update:modelValue="dimension = $event"
				@remove="dimension = emptyDimension()"
			/>

			<InlineFormControlLabel
				v-if="dimension?.column_name"
				:label="__('Max values')"
				control-width="4rem"
			>
				<NumberInput
					placeholder="10"
					:modelValue="maxSplitValues"
					@update:modelValue="maxSplitValues = $event"
				/>
			</InlineFormControlLabel>
		</div>
	</CollapsibleSection>
</template>
