<template>
  <main id="main" class="start-view" tabindex="-1">
    <section class="intro">
      <h1 class="intro-title">Forge a pack</h1>
      <p class="intro-lede">
        Make your own DDDnD adventures, with no code and no files to write by hand.
        Retell the game for your organization, or teach a different topic altogether.
      </p>
    </section>

    <p class="status-note" role="status">
      <strong>The Studio is being built.</strong>
      This is its first piece. Creating, editing and playing packs arrive over the next releases.
      Until then, packs are written as files: see the
      <a href="https://mooeypoo.github.io/DDDnD/guide/content-authoring" target="_blank" rel="noopener noreferrer">author guide</a>.
    </p>

    <section class="kinds" aria-labelledby="kinds-title">
      <h2 id="kinds-title" class="section-label">What you'll be able to make</h2>
      <div class="kind-grid">
        <article class="kind-card">
          <span class="kind-pill pill-setting">Same game, new setting</span>
          <h3 class="kind-title">Retell DDDnD for your organization</h3>
          <p>
            Your system, your stakeholders, your politics. Keeps the base game's scores and endings,
            so you write a scenario, a council, and the cards your team actually argues about.
          </p>
        </article>
        <article class="kind-card">
          <span class="kind-pill pill-topic">A different topic</span>
          <h3 class="kind-title">Teach a different topic</h3>
          <p>
            Reliability, security, product discovery: anything with trade-offs. You define what's measured,
            who sits at the table, and what kinds of leader a player can become.
          </p>
        </article>
      </div>
    </section>
  </main>

  <footer class="start-footer">
    <span>Made for a laptop or desktop screen. Tablets work; on a phone you can look around, not edit.</span>
    <span>Packs are text and numbers only: no code, no images.</span>
  </footer>
</template>

<style scoped>
.start-view {
  flex: 1;
  width: 100%;
  max-width: 75rem;
  margin: 0 auto;
  padding: 2.75rem 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 2.25rem;
}

.start-view:focus {
  outline: none;
}

.intro {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  max-width: 47.5rem;
}

.intro-title {
  font-size: 2.5rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--forge-gold);
}

.intro-lede {
  margin: 0;
  font-size: 1.0625rem;
}

.status-note {
  margin: 0;
  max-width: 47.5rem;
  padding: 0.875rem 1.125rem;
  border-radius: 0.625rem;
  border: 1px solid var(--forge-hairline-strong);
  background: var(--forge-panel);
}

.status-note strong {
  color: var(--forge-text-bright);
}

.section-label {
  margin-bottom: 0.875rem;
  font-family: var(--forge-font-body);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--forge-text-secondary);
}

.kind-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
  gap: 1.25rem;
}

.kind-card {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1.625rem 1.75rem;
  border-radius: var(--forge-radius);
  background: var(--forge-panel);
  border: 1px solid var(--forge-hairline);
}

.kind-card p {
  margin: 0;
}

.kind-pill {
  align-self: flex-start;
  padding: 0.2rem 0.625rem;
  border-radius: 999px;
  border: 1px solid currentColor;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.pill-setting { color: var(--forge-gold); }
.pill-topic { color: var(--forge-teal); }

.kind-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--forge-text-bright);
}

.start-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 2.5rem;
  border-top: 1px solid var(--forge-hairline);
  font-size: 0.8125rem;
  color: var(--forge-text-secondary);
}
</style>
