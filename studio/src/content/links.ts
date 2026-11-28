/**
 * Where the Studio points outside itself (the first-screen audit, M4.27):
 * the game, its docs and the example packs. One list, so the header and the
 * welcome page can't disagree.
 */

const DOCS = 'https://mooeypoo.github.io/DDDnD'

export const LINKS = {
  game: 'https://dddnd.app',
  /** The Studio's own guide, for authors using it. */
  studioGuide: `${DOCS}/guide/pack-studio`,
  /** The pack format by hand (manifests, folders): for advanced authors. */
  formatGuide: `${DOCS}/guide/content-authoring`,
  playerHelp: `${DOCS}/guide/gameplay`,
  examplePacks: 'https://github.com/mooeypoo/DDDnD-packs',
  source: 'https://github.com/mooeypoo/DDDnD',
} as const
