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

* {
  box-sizing: border-box;
}

html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100%;
}

body {
  font-family: var(--font-sans);
  background: var(--color-bg-darkest);
  color: var(--color-text-primary);
  line-height: var(--leading-normal);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
}

/* Improved default heading styles */
h1, h2, h3, h4, h5, h6 {
  margin: 0;
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
}

/* Improved focus styles */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}
</style>
