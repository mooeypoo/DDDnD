<template>
  <section class="author" v-if="author">
    <h3 class="author__title">Created By</h3>
    <p class="author__name">{{ author.name }}</p>
    <p class="author__blurb">{{ author.blurb }}</p>
    <div class="author__links">
      <a :href="author.github" target="_blank" rel="noopener noreferrer">GitHub</a>
      <a :href="author.website" target="_blank" rel="noopener noreferrer">Website</a>
      <a :href="author.blog" target="_blank" rel="noopener noreferrer">Blog</a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { site } = useData()

const author = computed(() => site.value.themeConfig?.author as {
  name: string
  github: string
  website: string
  blog: string
  blurb: string
})
</script>

<style scoped>
.author {
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
}

.author__title {
  margin: 0;
}

.author__name {
  margin: 0.25rem 0 0;
  color: var(--text-bright);
  font-weight: var(--font-semibold);
}

.author__blurb {
  margin: 0.75rem 0 0;
  color: var(--text-primary);
}

.author__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 0.8rem;
}

.author__links a {
  color: var(--text-accent);
}
</style>
