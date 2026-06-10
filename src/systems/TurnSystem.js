/**
 * TurnSystem.js — Turn Order & Phase Management
 */

class TurnSystem {
    constructor() {
        this.turn = 1;
        this.phase = 'PLAYER_TURN'; // PLAYER_TURN, ENEMY_TURN
        this.currentUnitIndex = 0;
        this.currentActingUnits = [];
    }

    /**
     * Advance to next turn/phase
     */
    nextPhase() {
        if (this.phase === 'PLAYER_TURN') {
            this.phase = 'ENEMY_TURN';
        } else {
            this.phase = 'PLAYER_TURN';
            this.turn++;
        }
        this.currentUnitIndex = 0;
    }

    /**
     * Reset turn state for all units
     */
    resetTurnState(units) {
        for (const unit of units) {
            unit.hasMoved = false;
            unit.hasAttacked = false;
        }
    }

    /**
     * Get current phase description
     */
    getPhaseText() {
        return `Turn ${this.turn} — ${this.phase === 'PLAYER_TURN' ? "Player's Turn" : "Enemy's Turn"}`;
    }

    /**
     * Get next enemy unit to act
     */
    getNextEnemyUnit(enemies) {
        if (this.currentUnitIndex >= enemies.length) {
            return null;
        }
        return enemies[this.currentUnitIndex];
    }

    /**
     * Move to next enemy
     */
    nextEnemyUnit() {
        this.currentUnitIndex++;
    }
}
