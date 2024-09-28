<template>
  <v-row>
    <v-col cols="12">
      <v-row no-gutters class="pb-2">
        <v-col class="flex-grow-1 flex-shrink-0 text-caption kode-mono-terminal">
          <v-row width="100%"
            ><v-col class="flex-grow-0 flex-shrink-1 pr-2 align-self-center"
              ><v-icon>{{ details.icon.value }}</v-icon></v-col
            ><v-col class="flex-grow-1 flex-shrink-0 pl-0 align-self-center">{{
              details.label
            }}</v-col></v-row
          >
        </v-col>
        <v-col class="d-flex justify-end">
          <!-- <v-chip size="x-small" color="green" class="mx-2">
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
          </v-chip> -->
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col cols="12">
          <v-progress-linear
            v-model="details.val.value"
            :color="details.color.value ? details.color.value : 'blue-grey'"
            height="16"
          >
            <template v-slot:default>
              <strong class="text-caption kode-mono-terminal"
                >{{ Math.ceil(details.val.value) }}%</strong
              >
            </template>
          </v-progress-linear>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>
<script setup>
import { useScoreAbstraction } from '@/use/scoreAbstraction'
const { getScoreElementDisplayDetails } = useScoreAbstraction()

// This should identify the element in ViewManager and in the store
const props = defineProps(['group', 'element'])

const details = getScoreElementDisplayDetails(props.group, props.element)
</script>
