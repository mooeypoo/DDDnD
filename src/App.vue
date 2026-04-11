<template>
  <div id="app" class="app-shell">
    <main class="app-main">
      <RouterView />
    </main>
    <SiteFooter v-if="showFooter" />
    <MobileNotice />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import SiteFooter from '@/ui/components/common/site_footer.vue'
import MobileNotice from '@/ui/components/common/mobile_notice.vue'

const route = useRoute()

const showFooter = computed(() => {
  return route.name === 'welcome' || route.name === 'play' || route.name === 'game' || route.name === 'end' || route.name === 'share'
})
</script>

<style>
@import './ui/styles/design-system.css';

/* base resets, typography, tokens, and focus ring are in design-system.css */

html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100%;
}

html {
  scroll-behavior: smooth;
}

body {
  background: var(--bg-page);
  color: var(--text-primary);
}

/* Tabletop field: depth gradient + fine blueprint dot grid.
 * The SVG dot pattern is rendered at ~3% opacity so it reads
 * as surface texture rather than structural decoration.
 * Additional radial gradient concentrates ambient light at top.
 */
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-page);
  background-image:
    radial-gradient(ellipse 140% 55% at 50% -5%, rgba(20, 27, 50, 0.60) 0%, transparent 60%),
    radial-gradient(ellipse 60% 30% at 80% 100%, rgba(14, 20, 40, 0.35) 0%, transparent 70%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Ccircle cx='1' cy='1' r='0.75' fill='rgba(255%2C255%2C255%2C0.030)'/%3E%3C/svg%3E");
  background-repeat: no-repeat, no-repeat, repeat;
  background-position: center top, right bottom, 0 0;
}

.app-main {
  flex: 1;
}
</style>
