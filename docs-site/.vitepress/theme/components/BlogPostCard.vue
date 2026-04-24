<template>
  <article class="post-card">
    <h4 class="post-card__title">
      <a :href="post.link" target="_blank" rel="noopener noreferrer">{{ post.title }}</a>
    </h4>
    <p class="post-card__meta">
      <span>{{ formattedDate }}</span>
      <span v-if="post.category_labels?.length">- {{ post.category_labels.join(', ') }}</span>
    </p>
    <p class="post-card__excerpt">{{ post.excerpt }}</p>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  post: {
    title: string
    link: string
    pub_date: string | null
    category_labels?: string[]
    excerpt: string
  }
}>()

const formattedDate = computed(() => {
  if (!props.post.pub_date) {
    return 'No date'
  }
  const date = new Date(props.post.pub_date)
  if (Number.isNaN(date.getTime())) {
    return 'No date'
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
})
</script>

<style scoped>
.post-card {
  border: 1px solid var(--border-card);
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-card);
}

.post-card__title {
  margin: 0;
  font-size: 1rem;
}

.post-card__title a {
  color: var(--text-bright);
  text-decoration: none;
}

.post-card__title a:hover {
  color: var(--text-accent);
}

.post-card__meta {
  margin: 0.45rem 0 0;
  color: var(--text-secondary);
  font-size: 0.78rem;
}

.post-card__excerpt {
  margin: 0.65rem 0 0;
  color: var(--text-primary);
  line-height: var(--leading-snug);
}
</style>
