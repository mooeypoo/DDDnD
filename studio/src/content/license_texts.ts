/**
 * License texts a zip export can include (M4.8a), by SPDX id. The domain
 * decides which license a pack has; this adapter supplies the words. The
 * GPL's text is the repository's own LICENSE, bundled at build time, so it
 * is the exact text the game is licensed under. A pack that builds on the
 * base game must be GPL-3.0-only or GPL-3.0-or-later (the game's validator),
 * and both are this text.
 */
import type { LicenseTexts } from '@/domains/authoring'

import gplText from '../../../LICENSE?raw'

export const LICENSE_TEXTS: LicenseTexts = { 'GPL-3.0-only': gplText, 'GPL-3.0-or-later': gplText }
