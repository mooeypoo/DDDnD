/**
 * stories/foundations/DesignTokens.stories.ts
 *
 * Design/development reference only — not for runtime use.
 * Showcases the DDDnD token system: surfaces, text, metrics, typography, spacing.
 */

import type { Meta, StoryObj } from '@storybook/vue3'

const meta: Meta = {
  title: 'Foundations/DesignTokens',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Visual reference for the DDDnD semantic token system. ' +
          'Tokens live in `src/ui/tokens/design-tokens.css` and are consumed via CSS custom properties.'
      }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// ─── Helper to build HTML blocks cleanly ────────────────────────

function sectionHeader(label: string): string {
  return `
    <p style="
      margin: 0 0 0.75rem 0;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 0.5rem;
    ">${label}</p>
  `
}

function swatchRow(items: { label: string; token: string; style: string }[]): string {
  return `
    <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem;">
      ${items
        .map(
          ({ label, token, style }) => `
        <div style="display: flex; flex-direction: column; gap: 0.375rem; min-width: 120px;">
          <div style="height: 44px; border-radius: 6px; ${style}; border: 1px solid rgba(255,255,255,0.07);"></div>
          <span style="font-size: 0.6875rem; color: var(--text-secondary); font-weight: 500;">${label}</span>
          <span style="font-size: 0.625rem; color: var(--text-muted); font-family: var(--font-mono);">${token}</span>
        </div>
      `
        )
        .join('')}
    </div>
  `
}

function textRow(
  items: { label: string; token: string; color: string }[]
): string {
  return `
    <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem;">
      ${items
        .map(
          ({ label, token, color }) => `
        <div style="display: flex; align-items: baseline; gap: 1rem;">
          <span style="font-size: 1rem; color: ${color}; min-width: 200px;">${label}</span>
          <span style="font-size: 0.625rem; color: var(--text-muted); font-family: var(--font-mono);">${token}</span>
        </div>
      `
        )
        .join('')}
    </div>
  `
}

const stage = `
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
  background: var(--bg-page);
  min-height: 100vh;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-primary);
`

// ═══════════════════════════════════════════════════════════
// 1. SURFACES
// ═══════════════════════════════════════════════════════════

export const Surfaces: Story = {
  render: () => ({
    template: `
      <div style="${stage}">
        ${sectionHeader('1. Background & Surface Tokens')}
        ${swatchRow([
          { label: 'bg-page',          token: '--bg-page',          style: 'background: var(--bg-page)' },
          { label: 'bg-secondary',     token: '--bg-secondary',     style: 'background: var(--bg-secondary)' },
          { label: 'surface-panel',    token: '--surface-panel',    style: 'background: var(--surface-panel)' },
          { label: 'surface-card',     token: '--surface-card',     style: 'background: var(--surface-card)' },
          { label: 'surface-elevated', token: '--surface-elevated', style: 'background: var(--surface-elevated)' },
          { label: 'surface-modal',    token: '--surface-modal',    style: 'background: var(--surface-modal)' },
        ])}
        ${swatchRow([
          { label: 'bg-overlay',        token: '--bg-overlay',        style: 'background: var(--bg-overlay); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1)' },
          { label: 'bg-overlay-strong', token: '--bg-overlay-strong', style: 'background: var(--bg-overlay-strong); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1)' },
          { label: 'bg-inset',          token: '--bg-inset',          style: 'background: var(--bg-inset); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1)' },
        ])}

        ${sectionHeader('Surface Layer Stack (Elevation Demo)')}
        <div style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
          <div style="background: var(--bg-page); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 1rem 1.5rem; font-size: 0.75rem; color: var(--text-muted);">Page</div>
          <div style="background: var(--surface-panel); border: 1px solid var(--border-panel); border-radius: 12px; padding: 1.25rem 1.5rem; box-shadow: var(--shadow-panel); font-size: 0.75rem; color: var(--text-secondary);">Panel</div>
          <div style="background: var(--surface-card); border: 1px solid var(--border-card); border-radius: 12px; padding: 1.5rem; box-shadow: var(--shadow-card); font-size: 0.75rem; color: var(--text-primary);">Card</div>
          <div style="background: var(--surface-elevated); border: 1px solid var(--border-accent); border-radius: 12px; padding: 1.75rem 1.5rem; box-shadow: var(--shadow-card-hover); font-size: 0.75rem; color: var(--text-accent);">Elevated</div>
          <div style="background: var(--surface-modal); border: 1px solid var(--border-accent); border-radius: 12px; padding: 2rem 1.5rem; box-shadow: var(--shadow-overlay); font-size: 0.75rem; color: var(--text-bright);">Modal</div>
        </div>
      </div>
    `
  })
}

// ═══════════════════════════════════════════════════════════
// 2. TEXT
// ═══════════════════════════════════════════════════════════

export const TextTokens: Story = {
  render: () => ({
    template: `
      <div style="${stage}">
        ${sectionHeader('2. Text Tokens')}
        ${textRow([
          { label: 'Text Bright — headings, key values',   token: '--text-bright',    color: 'var(--text-bright)'    },
          { label: 'Text Primary — standard body copy',    token: '--text-primary',   color: 'var(--text-primary)'   },
          { label: 'Text Secondary — labels, supporting',  token: '--text-secondary', color: 'var(--text-secondary)' },
          { label: 'Text Muted — metadata, de-emphasised', token: '--text-muted',     color: 'var(--text-muted)'     },
          { label: 'Text Accent — arcane purple emphasis', token: '--text-accent',    color: 'var(--text-accent)'    },
        ])}

        ${sectionHeader('3. Border Tokens')}
        <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem;">
          ${[
            { label: 'border-subtle (hairline)',   token: '--border-subtle',  color: 'var(--border-subtle)'  },
            { label: 'border-panel',               token: '--border-panel',   color: 'var(--border-panel)'   },
            { label: 'border-card',                token: '--border-card',    color: 'var(--border-card)'    },
            { label: 'border-accent (modal/focus origin)', token: '--border-accent', color: 'var(--border-accent)' },
            { label: 'border-focus (keyboard ring)', token: '--border-focus', color: 'var(--border-focus)'   },
          ]
            .map(
              ({ label, token, color }) => `
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div style="width: 200px; height: 0; border-top: 2px solid ${color};"></div>
              <span style="font-size: 0.75rem; color: var(--text-secondary); min-width: 220px;">${label}</span>
              <span style="font-size: 0.625rem; color: var(--text-muted); font-family: var(--font-mono);">${token}</span>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `
  })
}

// ═══════════════════════════════════════════════════════════
// 3. METRIC / EFFECT TOKENS
// ═══════════════════════════════════════════════════════════

export const MetricAccents: Story = {
  render: () => ({
    template: `
      <div style="${stage}">
        ${sectionHeader('4. Metric Identity Colors')}
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
          ${[
            { name: 'Maintainability',       token: '--metric-maintainability',     color: 'var(--metric-maintainability)'     },
            { name: 'Domain Clarity',        token: '--metric-domain-clarity',      color: 'var(--metric-domain-clarity)'      },
            { name: 'Delivery Confidence',   token: '--metric-delivery-confidence', color: 'var(--metric-delivery-confidence)' },
            { name: 'Developer Morale',      token: '--metric-developer-morale',    color: 'var(--metric-developer-morale)'    },
            { name: 'User Trust',            token: '--metric-user-trust',          color: 'var(--metric-user-trust)'          },
            { name: 'Budget',                token: '--metric-budget',              color: 'var(--metric-budget)'              },
          ]
            .map(
              ({ name, token, color }) => `
            <div style="
              background: var(--surface-card);
              border: 1px solid var(--border-card);
              border-radius: 10px;
              padding: 0.75rem 1rem;
              display: flex;
              flex-direction: column;
              gap: 0.375rem;
              min-width: 150px;
            ">
              <div style="width: 32px; height: 6px; border-radius: 999px; background: ${color};"></div>
              <span style="font-size: 0.75rem; font-weight: 600; color: ${color};">${name}</span>
              <span style="font-size: 0.625rem; color: var(--text-muted); font-family: var(--font-mono);">${token}</span>
            </div>
          `
            )
            .join('')}
        </div>

        ${sectionHeader('4. Effect State Tokens')}
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
          ${[
            { name: 'Positive',  bg: 'var(--effect-positive-bg)',  border: 'var(--effect-positive-border)',  color: 'var(--effect-positive)'  },
            { name: 'Negative',  bg: 'var(--effect-negative-bg)',  border: 'var(--effect-negative-border)',  color: 'var(--effect-negative)'  },
            { name: 'Warning',   bg: 'var(--effect-warning-bg)',   border: 'var(--effect-warning-border)',   color: 'var(--effect-warning)'   },
            { name: 'Neutral',   bg: 'var(--effect-neutral-bg)',   border: 'var(--effect-neutral-border)',   color: 'var(--effect-neutral)'   },
          ]
            .map(
              ({ name, bg, border, color }) => `
            <div style="
              background: ${bg};
              border: 1px solid ${border};
              color: ${color};
              border-radius: 6px;
              padding: 0.375rem 0.75rem;
              font-size: 0.75rem;
              font-weight: 600;
            ">${name} chip example</div>
          `
            )
            .join('')}
        </div>

        ${sectionHeader('Score / Satisfaction Tier Tokens')}
        <div style="display: flex; flex-direction: column; gap: 0.5rem; max-width: 320px;">
          ${[
            { label: 'Critical (< 20)',  color: 'var(--score-critical)' },
            { label: 'Low     (20–39)',  color: 'var(--score-low)'      },
            { label: 'Medium  (40–69)',  color: 'var(--score-medium)'   },
            { label: 'High    (70+)',    color: 'var(--score-high)'     },
          ]
            .map(
              ({ label, color }, i) => `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="
                height: 8px;
                width: ${[20, 35, 55, 85][i]}%;
                background: ${color};
                border-radius: 999px;
                flex-shrink: 0;
              "></div>
              <span style="font-size: 0.75rem; color: ${color}; font-weight: 600; min-width: 6rem;">${label}</span>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `
  })
}

// ═══════════════════════════════════════════════════════════
// 4. TYPOGRAPHY
// ═══════════════════════════════════════════════════════════

export const Typography: Story = {
  render: () => ({
    template: `
      <div style="${stage}">
        ${sectionHeader('5. Typography — Heading Font (Cinzel)')}
        <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;">
          <span style="font-family: var(--font-heading); font-size: var(--text-4xl); font-weight: 700; color: var(--text-bright); line-height: 1.2;">Monolith of Mild Despair</span>
          <span style="font-family: var(--font-heading); font-size: var(--text-2xl); font-weight: 600; color: var(--text-bright);">The Boundary Builder</span>
          <span style="font-family: var(--font-heading); font-size: var(--text-xl); font-weight: 500; color: var(--text-primary);">Turn 4 / 8 — Tactical Review</span>
          <span style="font-family: var(--font-heading); font-size: var(--text-base); font-weight: 400; color: var(--text-secondary);">Outcome Archetype: System Stabilizer</span>
        </div>

        ${sectionHeader('5. Typography — Body Font (Inter)')}
        <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem;">
          <span style="font-family: var(--font-body); font-size: var(--text-base); font-weight: 400; color: var(--text-primary); line-height: 1.65; max-width: 48ch;">
            Refactoring core aggregates introduces temporary complexity but reduces long-term maintenance
            burden. Every architectural decision has aftershocks.
          </span>
          <span style="font-family: var(--font-body); font-size: var(--text-sm); color: var(--text-secondary);">text-sm / secondary — card descriptions, turn briefings</span>
          <span style="font-family: var(--font-body); font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-muted);">text-xs / label style — section headers, metric names</span>
        </div>

        ${sectionHeader('5. Typography — Mono (JetBrains Mono / Fira Code)')}
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <span style="font-family: var(--font-mono); font-size: var(--text-2xl); font-weight: 900; color: var(--score-high);">84</span>
          <span style="font-family: var(--font-mono); font-size: var(--text-sm); color: var(--text-muted);">--font-mono — numeric values, score readouts</span>
        </div>
      </div>
    `
  })
}

// ═══════════════════════════════════════════════════════════
// 5. SPACING + RADIUS + SHADOW
// ═══════════════════════════════════════════════════════════

export const SpacingRadiusShadow: Story = {
  render: () => ({
    template: `
      <div style="${stage}">
        ${sectionHeader('6. Spacing Scale (8px grid)')}
        <div style="display: flex; align-items: flex-end; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
          ${[
            { token: '--space-1',  px: '4px',  w: 4  },
            { token: '--space-2',  px: '8px',  w: 8  },
            { token: '--space-3',  px: '12px', w: 12 },
            { token: '--space-4',  px: '16px', w: 16 },
            { token: '--space-6',  px: '24px', w: 24 },
            { token: '--space-8',  px: '32px', w: 32 },
            { token: '--space-10', px: '40px', w: 40 },
            { token: '--space-12', px: '48px', w: 48 },
          ]
            .map(
              ({ token, px, w }) => `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
              <div style="width: ${w}px; height: ${w}px; background: var(--text-accent); border-radius: 3px; opacity: 0.7;"></div>
              <span style="font-size: 0.625rem; color: var(--text-muted); font-family: var(--font-mono);">${px}</span>
            </div>
          `
            )
            .join('')}
        </div>

        ${sectionHeader('7. Radius Scale')}
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
          ${[
            { token: '--radius-sm',   r: '4px' },
            { token: '--radius-md',   r: '6px' },
            { token: '--radius-lg',   r: '8px' },
            { token: '--radius-xl',   r: '12px' },
            { token: '--radius-2xl',  r: '16px' },
            { token: '--radius-full', r: '9999px' },
          ]
            .map(
              ({ token, r }) => `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 0.375rem;">
              <div style="width: 56px; height: 44px; background: var(--surface-card); border: 1px solid var(--border-card); border-radius: ${r};"></div>
              <span style="font-size: 0.625rem; color: var(--text-muted); font-family: var(--font-mono);">${r}</span>
            </div>
          `
            )
            .join('')}
        </div>

        ${sectionHeader('8. Shadow Tokens')}
        <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
          ${[
            { label: 'shadow-panel',     shadow: 'var(--shadow-panel)',      bg: 'var(--surface-panel)' },
            { label: 'shadow-card',      shadow: 'var(--shadow-card)',       bg: 'var(--surface-card)'  },
            { label: 'shadow-card-hover',shadow: 'var(--shadow-card-hover)', bg: 'var(--surface-card)'  },
            { label: 'shadow-overlay',   shadow: 'var(--shadow-overlay)',    bg: 'var(--surface-modal)' },
          ]
            .map(
              ({ label, shadow, bg }) => `
            <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: center;">
              <div style="
                width: 80px;
                height: 60px;
                background: ${bg};
                border: 1px solid var(--border-card);
                border-radius: 10px;
                box-shadow: ${shadow};
              "></div>
              <span style="font-size: 0.625rem; color: var(--text-secondary); font-family: var(--font-mono);">${label}</span>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `
  })
}

// ═══════════════════════════════════════════════════════════
// 6. MOTION + Z-INDEX
// ═══════════════════════════════════════════════════════════

export const MotionZIndex: Story = {
  render: () => ({
    template: `
      <div style="${stage}">
        ${sectionHeader('9. Motion Tokens')}
        <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; font-family: var(--font-mono); font-size: var(--text-sm);">
          ${[
            { token: '--duration-instant', value: '80ms',  desc: 'Immediate feedback' },
            { token: '--duration-fast',    value: '140ms', desc: 'Hover / micro-interactions' },
            { token: '--duration-base',    value: '220ms', desc: 'Standard transitions' },
            { token: '--duration-slow',    value: '340ms', desc: 'State changes' },
            { token: '--duration-modal',   value: '260ms', desc: 'Modal appearance' },
            { token: '--duration-bar',     value: '700ms', desc: 'Score bar fill animation' },
          ]
            .map(
              ({ token, value, desc }) => `
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div style="
                width: 8px; height: 8px; border-radius: 50%;
                background: var(--text-accent);
                flex-shrink: 0;
              "></div>
              <span style="color: var(--text-accent); min-width: 10rem;">${token}</span>
              <span style="color: var(--text-primary); min-width: 4rem;">${value}</span>
              <span style="color: var(--text-muted); font-family: var(--font-body);">${desc}</span>
            </div>
          `
            )
            .join('')}
        </div>

        ${sectionHeader('9. Easing Curves')}
        <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; font-family: var(--font-mono); font-size: var(--text-xs);">
          ${[
            { token: '--ease-standard',   value: 'cubic-bezier(0.2, 0, 0, 1)',         desc: 'General smooth motion' },
            { token: '--ease-decelerate', value: 'cubic-bezier(0, 0, 0.2, 1)',          desc: 'Enter / appear (modal)' },
            { token: '--ease-accelerate', value: 'cubic-bezier(0.4, 0, 1, 1)',          desc: 'Exit / dismiss' },
            { token: '--ease-spring',     value: 'cubic-bezier(0.34, 1.56, 0.64, 1)',   desc: 'Card hover lift' },
          ]
            .map(
              ({ token, value, desc }) => `
            <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
              <span style="color: var(--text-accent); min-width: 11rem;">${token}</span>
              <span style="color: var(--text-secondary); min-width: 18rem;">${value}</span>
              <span style="color: var(--text-muted); font-family: var(--font-body);">${desc}</span>
            </div>
          `
            )
            .join('')}
        </div>

        ${sectionHeader('10. Z-Index Stack')}
        <div style="display: flex; flex-direction: column; gap: 0.5rem; font-family: var(--font-mono); font-size: var(--text-sm);">
          ${[
            { token: '--z-base',    value: '0',    desc: 'Default document flow' },
            { token: '--z-raised',  value: '10',   desc: 'Slightly elevated cards' },
            { token: '--z-sticky',  value: '100',  desc: 'Sticky headers / dropdowns' },
            { token: '--z-overlay', value: '400',  desc: 'Modal backdrop' },
            { token: '--z-modal',   value: '800',  desc: 'Dialog / card inspect' },
            { token: '--z-tooltip', value: '1200', desc: 'Tooltips' },
            { token: '--z-toast',   value: '1600', desc: 'Toasts / notifications' },
          ]
            .map(
              ({ token, value, desc }) => `
            <div style="display: flex; align-items: center; gap: 1rem;">
              <span style="color: var(--text-accent); min-width: 8rem;">${token}</span>
              <span style="color: var(--text-primary); min-width: 3rem;">${value}</span>
              <span style="color: var(--text-muted); font-family: var(--font-body);">${desc}</span>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `
  })
}
