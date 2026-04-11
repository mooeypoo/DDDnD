<template>
  <div class="social-links-panel">
    <div class="social-links-message">
      <span class="social-emoji">🧙‍♂️</span>
      <span>
        Enjoying your quest? Connect with the Dungeon Master beyond the dungeon gates:
      </span>
    </div>
    <div class="social-links-list">
      <a v-for="network in socials" :key="network.name" :href="network.url" class="social-link" target="_blank" rel="noopener noreferrer">
        <span class="social-icon" v-html="network.icon"></span>
        <span class="social-name">{{ network.name }}</span>
        <span class="external-link-indicator" aria-label="Opens in new tab">↗</span>
      </a>
    </div>

    <div class="coffee-section">
      <div class="coffee-divider" aria-hidden="true" />
      <a class="coffee-link" href="https://buymeacoffee.com/mooeypoo" target="_blank" rel="noopener noreferrer">
        <span class="coffee-icon">☕</span>
        <span class="coffee-text">Support the Dungeon Master with a Potion of Wakefulness</span>
        <span class="external-link-indicator" aria-label="Opens in new tab">↗</span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SocialNetwork {
  name: string
  url: string
  icon: string // SVG or emoji
}

const socials: SocialNetwork[] = [
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/moriel/',
    icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.27c-.97 0-1.75-.79-1.75-1.76s.78-1.76 1.75-1.76 1.75.79 1.75 1.76-.78 1.76-1.75 1.76zm15.5 11.27h-3v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.7h-3v-10h2.89v1.36h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v5.59z"/></svg>`
  },
  {
    name: 'Mastodon',
    url: 'https://notacult.social/@mooeypoo',
    icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.43 11.34c0-5.52-3.62-7.15-7.19-7.15h-.07c-3.57 0-7.19 1.63-7.19 7.15 0 1.41.13 2.7.38 3.85.36 1.7 2.13 3.6 6.81 3.6s6.45-1.9 6.81-3.6c.25-1.15.38-2.44.38-3.85zm-7.26 6.13c-2.7 0-4.89-.44-5.6-1.13-.18-.17-.28-.41-.28-.66v-1.13c0-.25.1-.49.28-.66.71-.69 2.9-1.13 5.6-1.13s4.89.44 5.6 1.13c.18.17.28.41.28.66v1.13c0 .25-.1.49-.28.66-.71.69-2.9 1.13-5.6 1.13zm-2.13-4.13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4.26 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>`
  },
  {
    name: 'Bluesky',
    url: 'https://bsky.app/profile/moriel.tech',
    icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10c0-5.52-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>`
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/morieltech/',
    icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.241 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.241 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.241-1.308-3.608C2.175 15.647 2.163 15.267 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.974-.974 2.241-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.013 7.052.072 5.771.131 4.635.363 3.678 1.32c-.957.957-1.189 2.093-1.248 3.374C2.013 8.332 2 8.741 2 12c0 3.259.013 3.668.072 4.948.059 1.281.291 2.417 1.248 3.374.957.957 2.093 1.189 3.374 1.248C8.332 23.987 8.741 24 12 24s3.668-.013 4.948-.072c1.281-.059 2.417-.291 3.374-1.248.957-.957 1.189-2.093 1.248-3.374.059-1.28.072-1.689.072-4.948 0-3.259-.013-3.668-.072-4.948-.059-1.281-.291-2.417-1.248-3.374-.957-.957-2.093-1.189-3.374-1.248C15.668.013 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/></svg>`
  },
  {
    name: 'Twitter/X',
    url: 'https://x.com/mooeypoo',
    icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.555-2.005.959-3.127 1.184A4.916 4.916 0 0 0 16.616 3c-2.72 0-4.924 2.206-4.924 4.924 0 .386.044.763.127 1.124C7.728 8.807 4.1 6.884 1.671 3.965c-.423.724-.666 1.561-.666 2.475 0 1.708.87 3.216 2.188 4.099a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.212c9.057 0 14.009-7.514 14.009-14.009 0-.213-.005-.425-.014-.636A10.012 10.012 0 0 0 24 4.557z"/></svg>`
  }
]
</script>

<style scoped>
.social-links-panel {
  margin: 2em 0 0 0;
  padding: 1.5em 1em 1em 1em;
  background: rgba(13, 9, 4, 0.45);
  border-radius: var(--radius-xl);
  border: 2px solid var(--dng-bronze-mid);
  box-shadow: 0 2px 12px rgba(160, 112, 24, 0.35);
  text-align: center;
}
.social-links-message {
  font-size: var(--text-base);
  color: var(--dng-title-gold);
  margin-bottom: 0.7em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
}
.social-emoji {
  font-size: 1.5em;
}
.social-links-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1em;
  justify-content: center;
  align-items: center;
  margin-top: 0.5em;
}
.social-link {
  display: flex;
  align-items: center;
  gap: 0.4em;
  background: var(--dng-shell-bg);
  border-radius: var(--radius-md);
  padding: 0.5em 1em;
  color: var(--dng-bronze-hi);
  font-weight: 600;
  text-decoration: none;
  font-size: var(--text-base);
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 4px rgba(160, 112, 24, 0.25);
}
.social-link:hover {
  background: var(--dng-bronze-mid);
  color: var(--dng-title-gold);
}
.social-icon {
  font-size: 1.2em;
  display: flex;
  align-items: center;
}
.social-name {
  margin-left: 0.1em;
}
.external-link-indicator {
  font-size: 0.9em;
  margin-left: 0.2em;
  vertical-align: text-top;
  opacity: 0.7;
}
.coffee-section {
  margin-top: var(--space-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
}

.coffee-divider {
  width: 60%;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--dng-bronze-mid), transparent);
  opacity: 0.5;
}

.coffee-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  background: rgba(13, 9, 4, 0.60);
  border: 1px solid var(--dng-bronze-mid);
  border-radius: var(--radius-md);
  padding: 0.45em 1.1em;
  color: var(--dng-title-gold);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  text-decoration: none;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  box-shadow: inset 0 1px 0 rgba(200, 152, 30, 0.12);
}

.coffee-link:hover {
  background: rgba(30, 18, 4, 0.80);
  border-color: var(--dng-bronze-hi);
  color: var(--dng-bronze-hi);
}

.coffee-icon {
  font-size: 1.1em;
  flex-shrink: 0;
}

.coffee-text {
  font-style: italic;
}
</style>
