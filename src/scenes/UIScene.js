/**
 * UIScene.js — HUD overlay scene
 */

class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this.mapScene = null;
        this.dom = null;
    }

    create() {
        this.mapScene = this.scene.get('MapScene');
        this.cacheDom();
        this.dom.turnLog.innerHTML = '';
        this.bindEvents();
        this.resetPanel();
    }

    cacheDom() {
        this.dom = {
            turnStatus: document.getElementById('turn-status'),
            unitPanel: document.getElementById('unit-panel'),
            unitName: document.getElementById('unit-name'),
            hpBar: document.getElementById('hp-bar'),
            hpText: document.getElementById('hp-text'),
            statAtk: document.getElementById('stat-atk'),
            statDef: document.getElementById('stat-def'),
            statMov: document.getElementById('stat-mov'),
            statRng: document.getElementById('stat-rng'),
            abilityDesc: document.getElementById('ability-desc'),
            endTurnBtn: document.getElementById('end-turn-btn'),
            turnLog: document.getElementById('turn-log'),
        };
    }

    bindEvents() {
        this.mapScene.events.on('ui:turnStatus', this.updateTurnStatus, this);
        this.mapScene.events.on('ui:unitSelected', this.updateUnitPanel, this);
        this.mapScene.events.on('ui:addLog', this.addLogEntry, this);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.mapScene.events.off('ui:turnStatus', this.updateTurnStatus, this);
            this.mapScene.events.off('ui:unitSelected', this.updateUnitPanel, this);
            this.mapScene.events.off('ui:addLog', this.addLogEntry, this);
        });

        this.dom.endTurnBtn.onclick = () => {
            this.game.events.emit('ui:endTurnRequested');
        };
    }

    updateTurnStatus(payload) {
        const { text, isPlayerTurn } = payload;
        this.dom.turnStatus.textContent = text;
        this.dom.endTurnBtn.disabled = !isPlayerTurn;
    }

    updateUnitPanel(unit) {
        if (!unit) {
            this.resetPanel();
            return;
        }

        const data = UNIT_DATA[unit.type];
        if (!data) {
            console.warn(`Missing UNIT_DATA for ${unit.type}`);
        }
        const hpPercent = Math.max(0, (unit.currentHP / unit.maxHP) * 100);

        this.dom.unitPanel.classList.add('active');
        this.dom.unitName.textContent = unit.type;
        this.dom.hpBar.style.width = `${hpPercent}%`;
        this.dom.hpBar.classList.toggle('damaged', hpPercent < 40);
        this.dom.hpText.textContent = `${unit.currentHP}/${unit.maxHP}`;
        this.dom.statAtk.textContent = unit.atk;
        this.dom.statDef.textContent = unit.def;
        this.dom.statMov.textContent = unit.mov;
        this.dom.statRng.textContent = unit.rng;
        this.dom.abilityDesc.textContent = data ? data.ability : 'No ability';
    }

    addLogEntry(message) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = message;
        this.dom.turnLog.appendChild(entry);
        this.dom.turnLog.scrollTop = this.dom.turnLog.scrollHeight;
    }

    resetPanel() {
        this.dom.unitPanel.classList.remove('active');
    }
}
