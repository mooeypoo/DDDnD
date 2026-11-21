/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string
  readonly MODE: string
  readonly VITE_SITE_URL?: string
  /** "true" turns on community content packs (ADR 0009). Anything else is off. */
  readonly VITE_ENABLE_COMMUNITY_PACKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
