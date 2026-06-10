/**
 * balance.js — Game Balance Constants
 */

const BALANCE = {
    // Damage calculation
    attackVarianceMin: 0.85,
    attackVarianceMax: 1.15,

    // Terrain
    terrainDefenseBonus: {
        forest: 0.2,
        mountain: 0,
        water: 0,
        grass: 0,
        town: 0,
    },

    // Special abilities
    mageSplashDamagePercent: 0.5,
    clericHealAmount: 25,
    rogueChainCritPercent: 20,

    // Unit costs (for Phase 2+ recruitment)
    unitRecruitCosts: {
        Soldier: 50,
        Knight: 80,
        Ranger: 70,
        Mage: 90,
        Cleric: 75,
        Rogue: 65,
    },

    // Gold rewards
    goldPerVictory: 100,
    goldPerEnemyKill: 10,
};
