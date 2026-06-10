/**
 * VictoryScene.js — Win/Lose screen
 */

class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    create(data) {
        const victory = Boolean(data && data.victory);
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor(0x101010);

        this.add.text(width / 2, height * 0.35, victory ? 'Victory!' : 'Defeat!', {
            fontFamily: 'Arial',
            fontSize: '64px',
            color: victory ? '#7CFC00' : '#ff4d4d',
            stroke: '#000000',
            strokeThickness: 6,
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.47, victory ? 'All enemies were defeated.' : 'Your army has fallen.', {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#ffffff',
        }).setOrigin(0.5);

        const button = this.add.image(width / 2, height * 0.64, 'btn-default').setInteractive({ useHandCursor: true });
        const label = this.add.text(width / 2, height * 0.64, 'Return to Menu', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#111111',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(1);

        button.on('pointerover', () => button.setTint(0xfff1a6));
        button.on('pointerout', () => button.clearTint());
        button.on('pointerdown', () => {
            this.scene.stop('UIScene');
            this.scene.start('MenuScene');
        });

        label.setDepth(1);
    }
}
