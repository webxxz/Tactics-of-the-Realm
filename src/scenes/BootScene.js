/**
 * BootScene.js — Asset preloader (placeholder textures)
 */

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        const gfx = this.add.graphics();

        const createRectTexture = (key, color, width = 36, height = 44) => {
            gfx.clear();
            gfx.fillStyle(color, 1);
            gfx.fillRoundedRect(0, 0, width, height, 6);
            gfx.lineStyle(2, 0x111111, 1);
            gfx.strokeRoundedRect(0, 0, width, height, 6);
            gfx.generateTexture(key, width, height);
        };

        if (typeof UNIT_DATA !== 'undefined') {
            Object.entries(UNIT_DATA).forEach(([name, data]) => {
                createRectTexture(`unit-${name}`, data.color || 0x888888);
            });
        }

        createRectTexture('btn-default', 0xd4af37, 260, 70);
        gfx.destroy();
    }

    create() {
        this.scene.start('MenuScene');
    }
}
