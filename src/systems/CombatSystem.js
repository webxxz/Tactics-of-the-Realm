/**
 * CombatSystem.js — Attack Resolution & Damage Calculation
 */

class CombatSystem {
    constructor() {
        this.lastDamageValue = 0;
        this.lastCritical = false;
    }

    /**
     * Execute attack between two units
     */
    executeAttack(attacker, defender, gridSystem) {
        // Calculate base damage
        let baseDamage = attacker.atk - defender.def * 0.5;
        baseDamage = Math.max(0, baseDamage);

        // Apply variance (±15%)
        const roll = Phaser.Math.Between(85, 115) / 100;
        let finalDamage = Math.max(1, Math.floor(baseDamage * roll));

        // Check for critical (Rogue only)
        let isCritical = false;
        if (attacker.type === 'Rogue' && Math.random() < 0.2) {
            finalDamage *= 2;
            isCritical = true;
        }

        this.lastDamageValue = finalDamage;
        this.lastCritical = isCritical;

        return { damage: finalDamage, isCritical };
    }

    /**
     * Apply special ability effects
     */
    applySpecialAbility(attacker, defender, targets, damageResult, gridSystem) {
        // Mage: AOE splash damage to adjacent tiles
        if (attacker.type === 'Mage') {
            const splashDamage = Math.floor(damageResult.damage * 0.5);
            const splashTargets = this.getAdjacentUnits(defender, gridSystem);

            for (const target of splashTargets) {
                if (target.id !== defender.id) {
                    target.currentHP = Math.max(0, target.currentHP - splashDamage);
                    if (target.currentHP === 0) {
                        target.isDead = true;
                    }
                }
            }
            return { splash: splashTargets, splashDamage };
        }

        // Rogue: high crit chance already handled in executeAttack

        // Cleric: instead of attacking, heals adjacent ally
        if (attacker.type === 'Cleric') {
            const healAmount = 25;
            const adjUnits = this.getAdjacentUnits(attacker, gridSystem);

            for (const unit of adjUnits) {
                if (unit.faction === attacker.faction && unit.id !== attacker.id) {
                    unit.currentHP = Math.min(unit.maxHP, unit.currentHP + healAmount);
                    return { healed: unit, amount: healAmount };
                }
            }
        }

        return {};
    }

    /**
     * Get units adjacent to a unit
     */
    getAdjacentUnits(unit, gridSystem) {
        const adjacent = [];
        const neighbors = [
            { x: unit.x + 1, y: unit.y },
            { x: unit.x - 1, y: unit.y },
            { x: unit.x, y: unit.y + 1 },
            { x: unit.x, y: unit.y - 1 },
            { x: unit.x + 1, y: unit.y + 1 },
            { x: unit.x - 1, y: unit.y - 1 },
            { x: unit.x + 1, y: unit.y - 1 },
            { x: unit.x - 1, y: unit.y + 1 },
        ];

        for (const neighbor of neighbors) {
            const occupant = gridSystem.getOccupant(neighbor.x, neighbor.y);
            if (occupant) {
                adjacent.push(occupant);
            }
        }

        return adjacent;
    }

    /**
     * Check if target is in range
     */
    isInAttackRange(attacker, target) {
        const distance = Math.max(Math.abs(attacker.x - target.x), Math.abs(attacker.y - target.y));
        return distance <= attacker.rng && distance > 0;
    }
}
