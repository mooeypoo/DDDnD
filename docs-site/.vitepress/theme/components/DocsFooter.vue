<template>
  <footer v-if="theme.footer" class="docs-footer" aria-label="Site footer">
    <a
      class="docs-footer-logo-link"
      href="https://moriel.tech"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit Moriel.Tech"
    >
      <img class="docs-footer-logo" :src="logo" alt="MorielTech logo" width="100" height="100" />
    </a>
    <div class="docs-footer-copy">
      <p v-if="theme.footer.message" class="docs-footer-message">{{ theme.footer.message }}</p>
      <p v-if="theme.footer.copyright" class="docs-footer-copyright">{{ theme.footer.copyright }}</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useData } from 'vitepress'
import logo from '../../../../src/assets/morieltech-logo.svg'

const { theme } = useData()
</script>
