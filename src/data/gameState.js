/**
 * gameState.js — Central Game State Object
 */

const GameState = {
    // Game systems
    grid: null,
    units: null,
    combat: null,
    turns: null,
    ai: null,
    progression: null,

    // Game state
    selectedUnit: null,
    isPlayerTurn: true,
    gameOver: false,
    winCondition: false,

    // Camera state
    cameraX: 0,
    cameraY: 0,
    zoomLevel: 1,

    /**
     * Initialize all systems
     */
    init(scene) {
        console.log('Initializing GameState');
        this.grid = null; // Will be set by MapScene
        this.units = new UnitSystem();
        this.combat = new CombatSystem();
        this.turns = new TurnSystem();
        this.ai = null; // Will be set by MapScene after grid is ready
        this.progression = new ProgressionSystem();
        this.selectedUnit = null;
        this.isPlayerTurn = true;
        this.gameOver = false;
        this.winCondition = false;
    },

    /**
     * Reset for new map
     */
    reset() {
        this.units = new UnitSystem();
        this.selectedUnit = null;
        this.isPlayerTurn = true;
        this.gameOver = false;
        this.winCondition = false;
        this.turns = new TurnSystem();
    },
};
