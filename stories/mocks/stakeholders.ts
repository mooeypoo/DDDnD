import type { StakeholderSnapshot } from '@/domains/simulation/model/game_state'

export const stakeholderStates: Record<'engHappyFinanceUpset' | 'productImpatientUsersFrustrated' | 'leadershipPleasedTeamExhausted', StakeholderSnapshot> = {
  engHappyFinanceUpset: {
    lead_engineer: { satisfaction: 83 },
    engineering_team: { satisfaction: 78 },
    finance_team: { satisfaction: 26 },
    cto: { satisfaction: 62 }
  },
  productImpatientUsersFrustrated: {
    vp_product: { satisfaction: 34 },
    product_team: { satisfaction: 39 },
    users: { satisfaction: 22 },
    support_team: { satisfaction: 46 }
  },
  leadershipPleasedTeamExhausted: {
    leadership_team: { satisfaction: 81 },
    cto: { satisfaction: 75 },
    engineering_team: { satisfaction: 27 },
    operations_team: { satisfaction: 33 }
  }
}
