/**
 * ProgressionSystem.js — Gold, Upgrades, Map Unlock (Phase 2+)
 */

class ProgressionSystem {
    constructor() {
        this.gold = 0;
        this.unlockedUnits = ['Soldier', 'Knight', 'Ranger', 'Rogue'];
        this.unitUpgrades = {
            Soldier: { hp: 0, atk: 0, mov: 0 },
            Knight: { hp: 0, atk: 0, mov: 0 },
            Ranger: { hp: 0, atk: 0, mov: 0 },
            Mage: { hp: 0, atk: 0, mov: 0 },
            Cleric: { hp: 0, atk: 0, mov: 0 },
            Rogue: { hp: 0, atk: 0, mov: 0 },
        };
        this.currentMap = 0;
        this.completedMaps = [];
    }

    /**
     * Add gold from combat
     */
    addGold(amount) {
        this.gold += amount;
    }

    /**
     * Purchase upgrade
     */
    purchaseUpgrade(unitType, upgradeType) {
        const costs = {
            hp: 30,
            atk: 40,
            mov: 50,
        };

        if (!costs[upgradeType]) return false;
        if (this.gold < costs[upgradeType]) return false;

        this.gold -= costs[upgradeType];
        this.unitUpgrades[unitType][upgradeType]++;
        return true;
    }

    /**
     * Unlock unit type
     */
    unlockUnit(unitType) {
        if (!this.unlockedUnits.includes(unitType)) {
            this.unlockedUnits.push(unitType);
        }
    }

    /**
     * Mark map as completed and unlock next map index
     */
    completeMap(mapIndex) {
        if (!this.completedMaps.includes(mapIndex)) {
            this.completedMaps.push(mapIndex);
        }
        this.currentMap = Math.max(this.currentMap, mapIndex + 1);
    }

    /**
     * Whether a map index is unlocked
     */
    isMapUnlocked(mapIndex) {
        return mapIndex < this.currentMap;
    }

    /**
     * Get upgrade modifier for a unit stat
     */
    getUpgradeBonus(unitType, statType) {
        const bonus = this.unitUpgrades[unitType][statType];
        if (statType === 'hp') return bonus * 10;
        if (statType === 'atk') return bonus * 5;
        if (statType === 'mov') return bonus;
        return 0;
    }

    /**
     * Load from save
     */
    loadFromSave(saveData) {
        this.gold = saveData.gold || 0;
        this.unlockedUnits = saveData.unlockedUnits || this.unlockedUnits;
        this.unitUpgrades = saveData.unitUpgrades || this.unitUpgrades;
        this.currentMap = saveData.currentMap || 0;
        this.completedMaps = saveData.completedMaps || [];
    }

    /**
     * Export to save
     */
    exportToSave() {
        return {
            gold: this.gold,
            unlockedUnits: this.unlockedUnits,
            unitUpgrades: this.unitUpgrades,
            currentMap: this.currentMap,
            completedMaps: this.completedMaps,
        };
    }
}
