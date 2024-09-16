<template>
  <v-card min-width="300">
    <v-card-item class="pb-0 kode-mono-terminal">
      <v-row>
        <v-col class="flex-grow-1 flex-shrink-0 text-caption kode-mono-terminal">{{
          details.label
        }}</v-col>
        <v-col class="d-flex justify-end">
          <v-chip size="x-small" color="green" class="mx-2">
            +5
            <v-tooltip activator="parent" class="kode-mono-terminal"
              >Source card | 5 turns</v-tooltip
            >
          </v-chip>
          <v-chip size="x-small" color="red" class="mx-2">
            -5
            <v-tooltip activator="parent" class="kode-mono-terminal"
              >Source card | 5 turns</v-tooltip
            >
          </v-chip>
        </v-col>
      </v-row>
    </v-card-item>
    <v-card-item>
      <v-row>
        <v-col>
          <v-progress-linear
            v-model="details.value.value"
            :color="details.color ? details.color : 'blue-grey'"
            height="16"
          >
            <template v-slot:default>
              <strong class="text-caption kode-mono-terminal"
                >{{ Math.ceil(details.value.value) }}%</strong
              >
            </template>
          </v-progress-linear>
        </v-col>
      </v-row>
    </v-card-item>
  </v-card>
</template>
<script setup>
import { scoreDetails } from '@/use/scoreDetails'
const { getScoreElementDisplayDetails } = scoreDetails()

// This should identify the element in ViewManager and in the store
const props = defineProps(['group', 'element'])

const details = getScoreElementDisplayDetails(props.group, props.element)
</script>
