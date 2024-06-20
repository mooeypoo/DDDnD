<template>
  <v-card
    :color="boxColor"
    variant="elevated"
    class="mx-auto"
    :prependIcon="boxIcon"
    :title="boxTitle"
    min-width="200"
  >
    <v-card-text class="bg-surface-light pt-4">
      <v-row v-for="(stat, i) in gameStatsForView[props.group]" :key="i">
        <v-col cols="12">
          <v-row>
            <v-col v-if="!stat.isPercentage" class="text-caption"
              ><v-icon :color="stat.color" :icon="stat.icon" class="mr-1"></v-icon
              ><span>{{ stat.title }}</span></v-col
            >
            <v-col v-if="!stat.isPercentage" :style="'color: ' + stat.color">
              <span class="font-weight-black">{{ stat.value }}</span>
            </v-col>
            <v-col v-if="stat.isPercentage" cols="12" sm="5" class="text-caption"
              ><v-icon :color="stat.color" :icon="stat.icon" class="mr-1"></v-icon
              ><span>{{ stat.title }}</span></v-col
            >
            <v-col v-if="stat.isPercentage" class="d-flex align-center">
              <v-progress-linear
                bg-color="pink-lighten-3"
                :color="stat.color"
                :modelValue="stat.value"
                rounded
              ></v-progress-linear>
              <v-badge
                v-if="stat.isPercentage"
                :color="stat.color"
                :content="stat.value + '%'"
                inline
              ></v-badge>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { scoreDetails } from '@/use/scoreDetails'

const props = defineProps(['group', 'color', 'title', 'icon'])
const { gameStatsForView } = scoreDetails()
const boxColor = props.color || 'pink'
const boxTitle = props.title || 'Stats'
const boxIcon = props.icon
</script>
