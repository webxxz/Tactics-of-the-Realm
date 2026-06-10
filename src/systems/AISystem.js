/**
 * AISystem.js — Enemy Decision Logic (Phase 1 Placeholder)
 */

class AISystem {
    constructor(gridSystem, combatSystem) {
        this.gridSystem = gridSystem;
        this.combatSystem = combatSystem;
    }

    /**
     * Decide AI action for a unit
     */
    decideAction(aiUnit, playerUnits) {
        if (aiUnit.isDead) return null;

        // Find nearest player unit within MOV + RNG range
        let nearest = null;
        let nearestDistance = Infinity;

        for (const pUnit of playerUnits) {
            if (pUnit.isDead) continue;

            const distance = Math.max(Math.abs(aiUnit.x - pUnit.x), Math.abs(aiUnit.y - pUnit.y));
            if (distance < nearestDistance && distance <= aiUnit.mov + aiUnit.rng) {
                nearest = pUnit;
                nearestDistance = distance;
            }
        }

        if (!nearest) {
            return null; // No target in range
        }

        // If in attack range: attack
        if (this.combatSystem.isInAttackRange(aiUnit, nearest)) {
            return {
                type: 'attack',
                target: nearest,
            };
        }

        // Otherwise: move closer
        return {
            type: 'move',
            target: nearest,
        };
    }

    /**
     * Execute move action
     */
    executeMove(aiUnit, targetUnit) {
        // Find path to target
        const path = this.gridSystem.findPath(aiUnit.x, aiUnit.y, targetUnit.x, targetUnit.y);

        if (path.length === 0) return null;

        // Move one step closer (or as far as movement allows)
        let moveCost = 0;
        let lastTile = { x: aiUnit.x, y: aiUnit.y };

        for (const tile of path) {
            const terrainInfo = this.gridSystem.terrainTypes[this.gridSystem.getTile(tile.x, tile.y).terrain];
            if (moveCost + terrainInfo.moveCost > aiUnit.mov) {
                break;
            }
            moveCost += terrainInfo.moveCost;
            lastTile = tile;
        }

        return lastTile;
    }
}
