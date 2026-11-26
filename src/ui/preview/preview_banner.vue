<template>
  <!--
    Every page of a preview tab says so (docs/PACK_STUDIO.md §11): the pack
    came from the Pack Studio, nothing is saved, and closing the tab ends it.
  -->
  <div class="preview-banner" role="note">
    <strong>Preview from DDDnD Pack Studio.</strong>
    Nothing here is saved, and this run can't be shared. Close this tab to end it.
  </div>
</template>

<style scoped>
.preview-banner {
  padding: 0.625rem 1.25rem;
  border-bottom: 2px solid var(--bazaar-stitch);
  background: var(--bazaar-panel);
  color: var(--bazaar-ink);
  font-size: 0.9375rem;
  text-align: center;
}

.preview-banner strong {
  color: var(--bazaar-accent);
}
</style>
