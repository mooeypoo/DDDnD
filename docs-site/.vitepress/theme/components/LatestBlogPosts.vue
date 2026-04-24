<template>
  <section class="blog-feed">
    <p v-if="loading" class="muted">Loading latest blog posts...</p>
    <p v-else-if="error" class="muted">Unable to load blog feed right now. Please visit <a href="https://blog.moriel.tech" target="_blank" rel="noopener noreferrer">blog.moriel.tech</a>.</p>
    <template v-else>
      <div v-if="posts.length" class="blog-feed__grid">
        <BlogPostCard v-for="post in posts" :key="post.link" :post="post" />
      </div>
      <p v-else class="muted">No DDDnD posts found in the configured feed.</p>
      <p class="blog-feed__more">
        <a href="https://blog.moriel.tech" target="_blank" rel="noopener noreferrer">Read more on blog.moriel.tech</a>
      </p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { withBase } from 'vitepress'

type BlogPost = {
  title: string
  link: string
  pub_date: string | null
  category_labels: string[]
  excerpt: string
}

const loading = ref(true)
const error = ref<string | null>(null)
const posts = ref<BlogPost[]>([])

onMounted(async () => {
  try {
    const response = await fetch(withBase('/data/blog-feed.json'))
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const payload = await response.json()
    posts.value = Array.isArray(payload.posts) ? payload.posts : []
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.blog-feed__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-4);
}

.blog-feed__more {
  margin-top: var(--space-3);
}

.muted {
  color: var(--text-secondary);
}
</style>
