/**
 * MenuScene.js — Main menu scene
 */

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor(0x1a1a1a);

        this.add.text(width / 2, height * 0.28, 'Tactics of the Realm', {
            fontFamily: 'Arial',
            fontSize: '52px',
            color: '#d4af37',
            stroke: '#000000',
            strokeThickness: 5,
        }).setOrigin(0.5);

        const button = this.add.image(width / 2, height * 0.58, 'btn-default').setInteractive({ useHandCursor: true });
        const label = this.add.text(width / 2, height * 0.58, 'Start Game', {
            fontFamily: 'Arial',
            fontSize: '30px',
            color: '#111111',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        button.on('pointerover', () => button.setTint(0xfff1a6));
        button.on('pointerout', () => button.clearTint());
        button.on('pointerdown', () => {
            this.scene.start('MapScene');
        });

        this.add.text(width / 2, height * 0.73, 'Defeat all enemies to win the battle', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#f2f2f2',
        }).setOrigin(0.5);

        label.setDepth(1);
    }
}
