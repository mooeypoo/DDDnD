<template>
  <div id="app" class="app-shell">
    <main class="app-main">
      <RouterView />
    </main>
    <SiteFooter v-if="showFooter" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import SiteFooter from '@/ui/components/common/site_footer.vue'

const route = useRoute()

const showFooter = computed(() => {
  return route.name === 'welcome' || route.name === 'play' || route.name === 'game' || route.name === 'end'
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

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(ellipse 120% 50% at 50% -10%, rgba(20, 27, 50, 0.55) 0%, transparent 65%),
    var(--bg-page);
}

.app-main {
  flex: 1;
}
</style>
