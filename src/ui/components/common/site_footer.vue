<template>
  <!--
    Lightweight site-credit footer for external author and repository links.
  -->
  <footer class="site-footer" aria-label="Site credits">
    <a href="https://moriel.tech" target="_blank" rel="noopener noreferrer" class="footer-link">
      Made by Moriel Schottlender
    </a>
    <span class="footer-separator" aria-hidden="true">•</span>
    <a href="https://github.com/mooeypoo/DDDnD" target="_blank" rel="noopener noreferrer" class="footer-link">
      GitHub
    </a>
  </footer>
</template>

<style scoped>
.site-footer {
  width: 100%;
  padding: var(--space-md) var(--space-lg) var(--space-lg);
  text-align: center;
  font-size: var(--text-xs);
  color: var(--dng-footer-muted);
  opacity: 0.72;
}

.footer-link {
  color: inherit;
  text-decoration: none;
  transition: color var(--transition-base), opacity var(--transition-base);
}

.footer-link:hover,
.footer-link:focus-visible {
  color: var(--dng-subtitle-warm);
  opacity: 1;
}

.footer-separator {
  margin: 0 var(--space-sm);
  color: var(--dng-footer-muted);
}

@media (max-width: 768px) {
  .site-footer {
    padding: var(--space-sm) var(--space-md) var(--space-md);
  }
}
</style>