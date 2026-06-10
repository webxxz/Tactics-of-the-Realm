/**
 * Tactics of the Realm — Main Game Configuration & Launch
 * Initializes Phaser 3 with all scenes
 */

const gameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false,
        },
    },
    parent: 'game-container',
    scene: [BootScene, MenuScene, MapScene, UIScene, VictoryScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        expandParent: true,
        fullscreenTarget: 'game-container',
    },
};

// Create the game instance
const game = new Phaser.Game(gameConfig);

// Handle window resize
window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});

// Log game initialization
console.log('Tactics of the Realm initialized', gameConfig);
