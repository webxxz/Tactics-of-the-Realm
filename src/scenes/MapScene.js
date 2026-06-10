/**
 * MapScene.js — Core battle loop scene
 */

class MapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MapScene' });
        this.currentMap = null;
        this.unitVisuals = new Map();
        this.selectedUnit = null;
        this.processingEnemyTurn = false;
    }

    create() {
        GameState.init(this);

        this.currentMapIndex = 0;
        this.currentMap = MAPS[this.currentMapIndex];
        GameState.grid = new GridSystem(this, this.currentMap.width, this.currentMap.height, 64);
        GameState.ai = new AISystem(GameState.grid, GameState.combat);

        this.scene.launch('UIScene');

        this.setupInput();
        this.spawnUnits();
        this.refreshTurnStatus();
        this.addLog('Battle started');
    }

    setupInput() {
        this.events.on('tile-clicked', this.handleTileClick, this);
        this.game.events.on('ui:endTurnRequested', this.handleEndTurnRequested, this);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.events.off('tile-clicked', this.handleTileClick, this);
            this.game.events.off('ui:endTurnRequested', this.handleEndTurnRequested, this);
        });
    }

    spawnUnits() {
        this.currentMap.playerUnits.forEach((entry) => {
            this.createUnit(entry.type, 'player', entry.position);
        });

        this.currentMap.enemyUnits.forEach((entry) => {
            this.createUnit(entry.type, 'enemy', entry.position);
        });
    }

    createUnit(type, faction, position) {
        const unit = GameState.units.createUnit(type, faction, position);
        if (!unit) return;

        const screen = this.getUnitScreenPosition(unit);
        const textureKey = `unit-${unit.type}`;
        const sprite = this.add.image(screen.x, screen.y - 18, textureKey).setDepth(screen.y + 20);

        if (!this.textures.exists(textureKey)) {
            sprite.setTint(UNIT_DATA[unit.type] ? UNIT_DATA[unit.type].color : 0x999999);
        }

        const hpBg = this.add.rectangle(screen.x, screen.y - 44, 40, 6, 0x111111, 0.85).setDepth(screen.y + 22);
        const hpFill = this.add.rectangle(screen.x - 20, screen.y - 44, 40, 4, faction === 'player' ? 0x54c965 : 0xe35555, 1)
            .setOrigin(0, 0.5)
            .setDepth(screen.y + 23);

        unit.displayObject = { sprite, hpBg, hpFill };
        this.unitVisuals.set(unit.id, unit.displayObject);
        GameState.grid.setOccupant(position.x, position.y, unit);
    }

    handleTileClick(pos) {
        if (GameState.gameOver || this.processingEnemyTurn) return;

        const tile = GameState.grid.getTile(pos.x, pos.y);
        if (!tile || GameState.turns.phase !== 'PLAYER_TURN') return;

        const clickedUnit = GameState.grid.getOccupant(pos.x, pos.y);

        if (this.selectedUnit && this.tryHandleAttackClick(pos)) return;
        if (this.selectedUnit && this.tryHandleMoveClick(pos)) return;

        if (clickedUnit && clickedUnit.faction === 'player' && !clickedUnit.isDead) {
            this.selectUnit(clickedUnit);
            return;
        }

        this.clearSelection();
    }

    tryHandleMoveClick(pos) {
        if (!this.selectedUnit || this.selectedUnit.hasMoved) return false;

        const canMove = GameState.grid.reachableTiles.some((tile) => tile.x === pos.x && tile.y === pos.y);
        if (!canMove) return false;

        this.moveUnitAnimated(this.selectedUnit, pos.x, pos.y, () => {
            this.selectedUnit.hasMoved = true;
            this.showAttackableTiles(this.selectedUnit);
            this.emitUnitSelection(this.selectedUnit);
            this.checkAutoEndPlayerTurn();
        });

        return true;
    }

    tryHandleAttackClick(pos) {
        if (!this.selectedUnit || this.selectedUnit.hasAttacked) return false;

        const canAttackTile = GameState.grid.attackableTiles.some((tile) => tile.x === pos.x && tile.y === pos.y);
        if (!canAttackTile) return false;

        const defender = GameState.grid.getOccupant(pos.x, pos.y);
        if (!defender || defender.faction !== 'enemy' || defender.isDead) return false;
        if (!GameState.combat.isInAttackRange(this.selectedUnit, defender)) return false;

        this.performAttack(this.selectedUnit, defender);
        return true;
    }

    moveUnitAnimated(unit, newX, newY, onComplete) {
        GameState.grid.setOccupant(unit.x, unit.y, null);
        GameState.units.moveUnit(unit.id, newX, newY);
        GameState.grid.setOccupant(newX, newY, unit);

        const target = this.getUnitScreenPosition(unit);
        const visuals = unit.displayObject;

        this.tweens.add({
            targets: [visuals.sprite, visuals.hpBg, visuals.hpFill],
            x: `+=${target.x - visuals.sprite.x}`,
            y: `+=${(target.y - 18) - visuals.sprite.y}`,
            duration: 280,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                visuals.hpBg.x = visuals.sprite.x;
                visuals.hpBg.y = visuals.sprite.y - 26;
                visuals.hpFill.x = visuals.hpBg.x - 20;
                visuals.hpFill.y = visuals.hpBg.y;
                visuals.sprite.setDepth(visuals.sprite.y + 40);
                visuals.hpBg.setDepth(visuals.sprite.y + 41);
                visuals.hpFill.setDepth(visuals.sprite.y + 42);
            },
            onComplete: () => {
                if (onComplete) onComplete();
            },
        });
    }

    showAttackableTiles(unit) {
        const candidates = GameState.grid.getAttackableTiles(unit.x, unit.y, unit.rng);
        const attackableEnemies = candidates.filter((tile) => {
            const occupant = GameState.grid.getOccupant(tile.x, tile.y);
            return occupant && occupant.faction !== unit.faction && !occupant.isDead;
        });

        GameState.grid.updateHighlights([], attackableEnemies, { x: unit.x, y: unit.y });
    }

    selectUnit(unit) {
        this.selectedUnit = unit;
        GameState.selectedUnit = unit;

        const reachable = unit.hasMoved ? [] : GameState.grid.getReachableTiles(unit.x, unit.y, unit.mov);
        const attackable = unit.hasMoved ? this.getEnemyAttackTilesFor(unit) : [];

        GameState.grid.updateHighlights(reachable, attackable, { x: unit.x, y: unit.y });
        this.emitUnitSelection(unit);
    }

    getEnemyAttackTilesFor(unit) {
        const candidates = GameState.grid.getAttackableTiles(unit.x, unit.y, unit.rng);
        return candidates.filter((tile) => {
            const occupant = GameState.grid.getOccupant(tile.x, tile.y);
            return occupant && occupant.faction !== unit.faction && !occupant.isDead;
        });
    }

    performAttack(attacker, defender) {
        const result = GameState.combat.executeAttack(attacker, defender, GameState.grid);
        GameState.units.damageUnit(defender.id, result.damage);
        attacker.hasAttacked = true;

        this.showDamageText(defender, result.damage, result.isCritical);
        this.updateUnitHPVisual(defender);

        this.addLog(`${attacker.type} hit ${defender.type} for ${result.damage}${result.isCritical ? ' CRIT' : ''}`);

        if (defender.isDead) {
            GameState.grid.setOccupant(defender.x, defender.y, null);
            this.handleUnitDefeat(defender);
        }

        this.emitUnitSelection(attacker);
        this.clearSelection();

        if (this.checkBattleEnd()) return;
        this.checkAutoEndPlayerTurn();
    }

    showDamageText(unit, damage, critical) {
        const screen = this.getUnitScreenPosition(unit);
        const text = this.add.text(screen.x, screen.y - 70, `-${damage}${critical ? '!' : ''}`, {
            fontFamily: 'Arial',
            fontSize: critical ? '26px' : '22px',
            color: critical ? '#ffd700' : '#ff6b6b',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5).setDepth(9999);

        this.tweens.add({
            targets: text,
            y: text.y - 35,
            alpha: 0,
            duration: 700,
            ease: 'Sine.easeOut',
            onComplete: () => text.destroy(),
        });
    }

    updateUnitHPVisual(unit) {
        if (!unit.displayObject) return;
        const hpPct = Math.max(0, unit.currentHP / unit.maxHP);
        unit.displayObject.hpFill.width = 40 * hpPct;
    }

    handleUnitDefeat(unit) {
        if (!unit.displayObject) return;

        this.tweens.add({
            targets: [unit.displayObject.sprite, unit.displayObject.hpBg, unit.displayObject.hpFill],
            alpha: 0,
            duration: 250,
            onComplete: () => {
                unit.displayObject.sprite.destroy();
                unit.displayObject.hpBg.destroy();
                unit.displayObject.hpFill.destroy();
            },
        });
    }

    clearSelection() {
        this.selectedUnit = null;
        GameState.selectedUnit = null;
        GameState.grid.clearHighlights();
        this.events.emit('ui:unitSelected', null);
    }

    checkAutoEndPlayerTurn() {
        const playerUnits = GameState.units.getUnitsByFaction('player');
        const allDone = playerUnits.length > 0 && playerUnits.every((unit) => unit.hasMoved && unit.hasAttacked);
        if (allDone) {
            this.handleEndTurnRequested();
        }
    }

    handleEndTurnRequested() {
        if (GameState.turns.phase !== 'PLAYER_TURN' || this.processingEnemyTurn || GameState.gameOver) return;

        this.clearSelection();
        GameState.turns.nextPhase();
        this.refreshTurnStatus();
        this.addLog('Enemy turn begins');
        this.runEnemyTurn();
    }

    async runEnemyTurn() {
        this.processingEnemyTurn = true;

        const enemies = GameState.units.getUnitsByFaction('enemy');
        for (const enemy of enemies) {
            if (enemy.isDead) continue;
            if (this.checkBattleEnd()) return;

            const players = GameState.units.getUnitsByFaction('player');
            const action = GameState.ai.decideAction(enemy, players);
            if (!action) continue;

            if (action.type === 'move') {
                const destination = GameState.ai.executeMove(enemy, action.target);
                if (destination && (destination.x !== enemy.x || destination.y !== enemy.y)) {
                    await this.waitForMove(enemy, destination.x, destination.y);
                    this.addLog(`${enemy.type} moved`);
                }

                if (!action.target.isDead && GameState.combat.isInAttackRange(enemy, action.target)) {
                    await this.wait(220);
                    this.enemyAttack(enemy, action.target);
                }
            }

            if (action.type === 'attack' && !action.target.isDead) {
                await this.wait(180);
                this.enemyAttack(enemy, action.target);
            }

            await this.wait(260);
        }

        if (this.checkBattleEnd()) return;

        GameState.turns.nextPhase();
        GameState.turns.resetTurnState(GameState.units.getUnitsByFaction('player'));
        this.processingEnemyTurn = false;
        this.refreshTurnStatus();
        this.addLog('Player turn begins');
    }

    enemyAttack(attacker, defender) {
        if (attacker.isDead || defender.isDead) return;

        const result = GameState.combat.executeAttack(attacker, defender, GameState.grid);
        GameState.units.damageUnit(defender.id, result.damage);

        this.showDamageText(defender, result.damage, result.isCritical);
        this.updateUnitHPVisual(defender);
        this.addLog(`${attacker.type} struck ${defender.type} for ${result.damage}`);

        if (defender.isDead) {
            GameState.grid.setOccupant(defender.x, defender.y, null);
            this.handleUnitDefeat(defender);
        }

        this.emitUnitSelection(this.selectedUnit);
    }

    checkBattleEnd() {
        const playerAlive = GameState.units.getUnitsByFaction('player').length;
        const enemyAlive = GameState.units.getUnitsByFaction('enemy').length;

        if (enemyAlive === 0) {
            GameState.gameOver = true;
            this.processingEnemyTurn = false;
            GameState.progression.addGold(this.currentMap.goldReward || 0);
            GameState.progression.completeMap(this.currentMapIndex);
            this.transitionToVictory(true);
            return true;
        }

        if (playerAlive === 0) {
            GameState.gameOver = true;
            this.processingEnemyTurn = false;
            this.transitionToVictory(false);
            return true;
        }

        return false;
    }

    transitionToVictory(victory) {
        this.scene.stop('UIScene');
        this.scene.start('VictoryScene', { victory });
    }

    refreshTurnStatus() {
        const isPlayerTurn = GameState.turns.phase === 'PLAYER_TURN';
        this.events.emit('ui:turnStatus', {
            text: GameState.turns.getPhaseText(),
            isPlayerTurn,
        });
    }

    emitUnitSelection(unit) {
        this.events.emit('ui:unitSelected', unit || null);
    }

    addLog(text) {
        this.events.emit('ui:addLog', text);
    }

    getUnitScreenPosition(unit) {
        const pos = GameState.grid.gridToScreen(unit.x, unit.y);
        return {
            x: pos.x,
            y: pos.y + GameState.grid.isoHeight,
        };
    }

    waitForMove(unit, x, y) {
        return new Promise((resolve) => {
            this.moveUnitAnimated(unit, x, y, resolve);
        });
    }

    wait(ms) {
        return new Promise((resolve) => {
            this.time.delayedCall(ms, resolve);
        });
    }
}
