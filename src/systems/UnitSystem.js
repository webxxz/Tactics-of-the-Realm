/**
 * UnitSystem.js — Unit Data Model & Management
 */

class UnitSystem {
    constructor() {
        this.units = [];
        this.nextId = 1;
    }

    /**
     * Create a new unit instance
     */
    createUnit(type, faction, position) {
        const unitData = UNIT_DATA[type];
        if (!unitData) {
            console.error(`Unknown unit type: ${type}`);
            return null;
        }

        const unit = {
            id: this.nextId++,
            type,
            faction, // 'player' or 'enemy'
            x: position.x,
            y: position.y,
            currentHP: unitData.hp,
            maxHP: unitData.hp,
            atk: unitData.atk,
            def: unitData.def,
            mov: unitData.mov,
            rng: unitData.rng,
            cost: unitData.cost,
            hasMoved: false,
            hasAttacked: false,
            statusEffects: [],
            isDead: false,
            displayObject: null, // Reference to Phaser sprite/graphics
        };

        this.units.push(unit);
        return unit;
    }

    /**
     * Get unit by ID
     */
    getUnitById(id) {
        return this.units.find((u) => u.id === id);
    }

    /**
     * Get all units of a faction
     */
    getUnitsByFaction(faction) {
        return this.units.filter((u) => u.faction === faction && !u.isDead);
    }

    /**
     * Get all alive units
     */
    getAliveUnits() {
        return this.units.filter((u) => !u.isDead);
    }

    /**
     * Move unit to new position
     */
    moveUnit(unitId, newX, newY) {
        const unit = this.getUnitById(unitId);
        if (unit) {
            unit.x = newX;
            unit.y = newY;
            unit.hasMoved = true;
        }
    }

    /**
     * Mark unit as attacked this turn
     */
    markUnitAttacked(unitId) {
        const unit = this.getUnitById(unitId);
        if (unit) {
            unit.hasAttacked = true;
        }
    }

    /**
     * Reset unit turn state
     */
    resetUnitTurn(unitId) {
        const unit = this.getUnitById(unitId);
        if (unit) {
            unit.hasMoved = false;
            unit.hasAttacked = false;
        }
    }

    /**
     * Damage unit
     */
    damageUnit(unitId, damage) {
        const unit = this.getUnitById(unitId);
        if (unit) {
            unit.currentHP = Math.max(0, unit.currentHP - damage);
            if (unit.currentHP === 0) {
                unit.isDead = true;
            }
        }
    }

    /**
     * Heal unit
     */
    healUnit(unitId, amount) {
        const unit = this.getUnitById(unitId);
        if (unit) {
            unit.currentHP = Math.min(unit.maxHP, unit.currentHP + amount);
        }
    }

    /**
     * Remove dead units from tracking
     */
    removeDeadUnits() {
        this.units = this.units.filter((u) => !u.isDead);
    }

    /**
     * Get unit at grid position
     */
    getUnitAtPosition(x, y) {
        return this.units.find((u) => u.x === x && u.y === y && !u.isDead);
    }

    /**
     * Get all units except one
     */
    getOtherUnits(unitId) {
        return this.units.filter((u) => u.id !== unitId && !u.isDead);
    }
}
