import type { AvatarMood, AvatarRoleId } from './presentation_asset_types'

import bardHappyUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/bard/happy.png?url'
import bardNeutralUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/bard/neutral.png?url'
import bardConcernedUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/bard/concerned.png?url'
import bardAngryUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/bard/angry.png?url'

import clericHappyUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/cleric/happy.png?url'
import clericNeutralUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/cleric/neutral.png?url'
import clericConcernedUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/cleric/concerned.png?url'
import clericAngryUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/cleric/angry.png?url'

import dragonwarriorHappyUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/dragonwarrior/happy.png?url'
import dragonwarriorNeutralUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/dragonwarrior/neutral.png?url'
import dragonwarriorConcernedUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/dragonwarrior/concerned.png?url'
import dragonwarriorAngryUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/dragonwarrior/angry.png?url'

import paladinHappyUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/paladin/happy.png?url'
import paladinNeutralUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/paladin/neutral.png?url'
import paladinConcernedUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/paladin/concerned.png?url'
import paladinAngryUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/paladin/angry.png?url'

import rogueHappyUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/rogue/happy.png?url'
import rogueNeutralUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/rogue/neutral.png?url'
import rogueConcernedUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/rogue/concerned.png?url'
import rogueAngryUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/rogue/angry.png?url'

import sorcererHappyUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/sorcerer/happy.png?url'
import sorcererNeutralUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/sorcerer/neutral.png?url'
import sorcererConcernedUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/sorcerer/concerned.png?url'
import sorcererAngryUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/sorcerer/angry.png?url'

import warriorHappyUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/warrior/happy.png?url'
import warriorNeutralUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/warrior/neutral.png?url'
import warriorConcernedUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/warrior/concerned.png?url'
import warriorAngryUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/warrior/angry.png?url'

import witchHappyUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/witch/happy.png?url'
import witchNeutralUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/witch/neutral.png?url'
import witchConcernedUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/witch/concerned.png?url'
import witchAngryUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/witch/angry.png?url'

import wizardHappyUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/wizard/happy.png?url'
import wizardNeutralUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/wizard/neutral.png?url'
import wizardConcernedUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/wizard/concerned.png?url'
import wizardAngryUrl from '@/assets/presentation/avatars/stakeholder-avatar-roles/wizard/angry.png?url'

export const DEFAULT_AVATAR_ROLE_ID: AvatarRoleId = 'wizard'
export const DEFAULT_AVATAR_MOOD: AvatarMood = 'neutral'

export const AVATAR_ROLE_ASSETS: Record<AvatarRoleId, Record<AvatarMood, string>> = {
  bard: {
    happy: bardHappyUrl,
    neutral: bardNeutralUrl,
    concerned: bardConcernedUrl,
    angry: bardAngryUrl,
  },
  cleric: {
    happy: clericHappyUrl,
    neutral: clericNeutralUrl,
    concerned: clericConcernedUrl,
    angry: clericAngryUrl,
  },
  dragonwarrior: {
    happy: dragonwarriorHappyUrl,
    neutral: dragonwarriorNeutralUrl,
    concerned: dragonwarriorConcernedUrl,
    angry: dragonwarriorAngryUrl,
  },
  paladin: {
    happy: paladinHappyUrl,
    neutral: paladinNeutralUrl,
    concerned: paladinConcernedUrl,
    angry: paladinAngryUrl,
  },
  rogue: {
    happy: rogueHappyUrl,
    neutral: rogueNeutralUrl,
    concerned: rogueConcernedUrl,
    angry: rogueAngryUrl,
  },
  sorcerer: {
    happy: sorcererHappyUrl,
    neutral: sorcererNeutralUrl,
    concerned: sorcererConcernedUrl,
    angry: sorcererAngryUrl,
  },
  warrior: {
    happy: warriorHappyUrl,
    neutral: warriorNeutralUrl,
    concerned: warriorConcernedUrl,
    angry: warriorAngryUrl,
  },
  witch: {
    happy: witchHappyUrl,
    neutral: witchNeutralUrl,
    concerned: witchConcernedUrl,
    angry: witchAngryUrl,
  },
  wizard: {
    happy: wizardHappyUrl,
    neutral: wizardNeutralUrl,
    concerned: wizardConcernedUrl,
    angry: wizardAngryUrl,
  },
}

export function getAvatarRoleAssetUrl(
  avatarRole: AvatarRoleId | string | undefined,
  mood: AvatarMood | string | undefined
): string {
  const safeRole = avatarRole && avatarRole in AVATAR_ROLE_ASSETS
    ? (avatarRole as AvatarRoleId)
    : DEFAULT_AVATAR_ROLE_ID

  const roleAssets = AVATAR_ROLE_ASSETS[safeRole]

  if (!mood || !(mood in roleAssets)) {
    return roleAssets[DEFAULT_AVATAR_MOOD]
  }

  return roleAssets[mood as AvatarMood]
}
