/**
 * GridSystem.js — Isometric Grid Rendering & Tile Management
 * Handles 10x10 isometric grid with terrain types, pathfinding, and highlighting
 */

class GridSystem {
    constructor(scene, width = 10, height = 10, tileSize = 64) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;

        // Isometric dimensions
        this.isoWidth = tileSize;
        this.isoHeight = tileSize / 2;

        // Grid of tile objects
        this.tiles = [];

        // Terrain type definitions
        this.terrainTypes = {
            grass: { moveCost: 1, defenseBonus: 0, color: 0x4a7c3c, name: 'Grass' },
            forest: { moveCost: 2, defenseBonus: 0.2, color: 0x2d5a2d, name: 'Forest' },
            mountain: { moveCost: 3, defenseBonus: 0, color: 0x8b7d6b, name: 'Mountain', impassable: true },
            water: { moveCost: Infinity, defenseBonus: 0, color: 0x3d5a9d, name: 'Water', impassable: true },
            town: { moveCost: 1, defenseBonus: 0, color: 0xd4a574, hpRegen: 0.1, name: 'Town' },
        };

        // Layer for tiles
        this.tileLayer = this.scene.add.graphics();
        this.highlightLayer = this.scene.add.graphics();
        this.unitLayer = this.scene.add.layer();

        // Selected tile tracking
        this.selectedTile = null;
        this.reachableTiles = [];
        this.attackableTiles = [];

        // Initialize grid
        this.generateGrid();
        this.drawGrid();

        // Input handling
        this.setupInput();
    }

    /**
     * Generate the grid of tiles
     */
    generateGrid() {
        const terrainNames = Object.keys(this.terrainTypes);

        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                // Weighted random terrain (60% grass, 20% forest, 10% mountain, 5% water, 5% town)
                let terrain = 'grass';
                const rand = Math.random();
                if (rand < 0.05) terrain = 'town';
                else if (rand < 0.10) terrain = 'water';
                else if (rand < 0.20) terrain = 'mountain';
                else if (rand < 0.40) terrain = 'forest';

                this.tiles[y][x] = {
                    x,
                    y,
                    terrain,
                    occupant: null,
                    highlighted: false,
                    highlightType: null, // 'movement', 'attack', 'selected'
                };
            }
        }
    }

    /**
     * Draw the isometric grid on the graphics layer
     */
    drawGrid() {
        this.tileLayer.clear();

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.drawTile(x, y);
            }
        }
    }

    /**
     * Draw a single tile at grid position (x, y)
     */
    drawTile(gridX, gridY) {
        const tile = this.tiles[gridY][gridX];
        const screenPos = this.gridToScreen(gridX, gridY);

        // Get terrain color
        const terrainInfo = this.terrainTypes[tile.terrain];
        const color = terrainInfo.color;

        // Draw isometric diamond (tilted square)
        const points = [
            { x: screenPos.x, y: screenPos.y },
            { x: screenPos.x + this.isoWidth / 2, y: screenPos.y + this.isoHeight },
            { x: screenPos.x, y: screenPos.y + this.isoHeight * 2 },
            { x: screenPos.x - this.isoWidth / 2, y: screenPos.y + this.isoHeight },
        ];

        this.tileLayer.fillStyle(color, 1);
        this.tileLayer.beginPath();
        this.tileLayer.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.tileLayer.lineTo(points[i].x, points[i].y);
        }
        this.tileLayer.closePath();
        this.tileLayer.fillPath();

        // Draw border
        this.tileLayer.strokeStyle(0x333333, 1);
        this.tileLayer.beginPath();
        this.tileLayer.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.tileLayer.lineTo(points[i].x, points[i].y);
        }
        this.tileLayer.closePath();
        this.tileLayer.strokePath();
    }

    /**
     * Draw highlights on the highlight layer
     */
    drawHighlights() {
        this.highlightLayer.clear();

        // Draw reachable movement tiles (blue)
        for (const tile of this.reachableTiles) {
            this.drawTileHighlight(tile.x, tile.y, 0x3d5aff, 0.3, 'movement');
        }

        // Draw attackable tiles (red)
        for (const tile of this.attackableTiles) {
            this.drawTileHighlight(tile.x, tile.y, 0xff3d3d, 0.3, 'attack');
        }

        // Draw selected tile (yellow)
        if (this.selectedTile) {
            this.drawTileHighlight(this.selectedTile.x, this.selectedTile.y, 0xffff00, 0.4, 'selected');
        }
    }

    /**
     * Helper to draw a highlighted tile
     */
    drawTileHighlight(gridX, gridY, color, alpha, type) {
        const screenPos = this.gridToScreen(gridX, gridY);
        const points = [
            { x: screenPos.x, y: screenPos.y },
            { x: screenPos.x + this.isoWidth / 2, y: screenPos.y + this.isoHeight },
            { x: screenPos.x, y: screenPos.y + this.isoHeight * 2 },
            { x: screenPos.x - this.isoWidth / 2, y: screenPos.y + this.isoHeight },
        ];

        this.highlightLayer.fillStyle(color, alpha);
        this.highlightLayer.beginPath();
        this.highlightLayer.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.highlightLayer.lineTo(points[i].x, points[i].y);
        }
        this.highlightLayer.closePath();
        this.highlightLayer.fillPath();

        // Draw bright border
        this.highlightLayer.strokeStyle(color, 1);
        this.highlightLayer.lineWidth = 2;
        this.highlightLayer.beginPath();
        this.highlightLayer.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.highlightLayer.lineTo(points[i].x, points[i].y);
        }
        this.highlightLayer.closePath();
        this.highlightLayer.strokePath();
    }

    /**
     * Convert grid coordinates (x, y) to screen coordinates
     */
    gridToScreen(gridX, gridY) {
        // Isometric projection: offset by grid center
        const centerX = this.scene.cameras.main.width / 2;
        const centerY = this.scene.cameras.main.height / 2;

        const screenX = centerX + (gridX - gridY) * (this.isoWidth / 2);
        const screenY = centerY + (gridX + gridY) * (this.isoHeight);

        return { x: screenX, y: screenY };
    }

    /**
     * Convert screen coordinates to grid coordinates (reverse isometric projection)
     */
    screenToGrid(screenX, screenY) {
        const centerX = this.scene.cameras.main.width / 2;
        const centerY = this.scene.cameras.main.height / 2;

        const relX = screenX - centerX;
        const relY = screenY - centerY;

        const gridX = (relX / (this.isoWidth / 2) + relY / this.isoHeight) / 2;
        const gridY = (relY / this.isoHeight - relX / (this.isoWidth / 2)) / 2;

        return {
            x: Math.round(gridX),
            y: Math.round(gridY),
        };
    }

    /**
     * Get tile at grid position
     */
    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
        return this.tiles[y][x];
    }

    /**
     * Set occupant on a tile
     */
    setOccupant(x, y, unit) {
        const tile = this.getTile(x, y);
        if (tile) {
            tile.occupant = unit;
        }
    }

    /**
     * Get occupant on a tile
     */
    getOccupant(x, y) {
        const tile = this.getTile(x, y);
        return tile ? tile.occupant : null;
    }

    /**
     * Breadth-First Search (BFS) to find reachable tiles from a position
     */
    getReachableTiles(startX, startY, movePoints) {
        const visited = new Set();
        const queue = [{ x: startX, y: startY, cost: 0 }];
        const reachable = [];

        while (queue.length > 0) {
            const { x, y, cost } = queue.shift();
            const key = `${x},${y}`;

            if (visited.has(key)) continue;
            visited.add(key);

            if (cost > movePoints) continue;

            const tile = this.getTile(x, y);
            if (!tile) continue;

            // Check if passable
            const terrain = this.terrainTypes[tile.terrain];
            if (terrain.impassable && !(x === startX && y === startY)) continue;

            // Add to reachable if not occupied (or is the start)
            if (!tile.occupant || (x === startX && y === startY)) {
                if (!(x === startX && y === startY)) {
                    reachable.push({ x, y });
                }
            }

            // Explore neighbors
            const neighbors = [
                { x: x + 1, y },
                { x: x - 1, y },
                { x, y: y + 1 },
                { x, y: y - 1 },
                { x: x + 1, y: y + 1 },
                { x: x - 1, y: y - 1 },
                { x: x + 1, y: y - 1 },
                { x: x - 1, y: y + 1 },
            ];

            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                if (!visited.has(neighborKey)) {
                    const neighborTile = this.getTile(neighbor.x, neighbor.y);
                    if (neighborTile) {
                        const neighborTerrain = this.terrainTypes[neighborTile.terrain];
                        const newCost = cost + neighborTerrain.moveCost;
                        if (newCost <= movePoints) {
                            queue.push({ x: neighbor.x, y: neighbor.y, cost: newCost });
                        }
                    }
                }
            }
        }

        return reachable;
    }

    /**
     * Find all tiles in attack range (distance-based)
     */
    getAttackableTiles(startX, startY, rangeLimit) {
        const attackable = [];

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const distance = Math.max(Math.abs(x - startX), Math.abs(y - startY));
                if (distance <= rangeLimit && distance > 0) {
                    attackable.push({ x, y });
                }
            }
        }

        return attackable;
    }

    /**
     * Find a path from start to end using A* algorithm
     */
    findPath(startX, startY, endX, endY) {
        // Simple Euclidean heuristic for A*
        const heuristic = (x, y) => Math.abs(x - endX) + Math.abs(y - endY);

        const openSet = [{ x: startX, y: startY, g: 0, h: heuristic(startX, startY) }];
        const cameFrom = {};
        const gScore = {};
        const key = (x, y) => `${x},${y}`;

        gScore[key(startX, startY)] = 0;

        while (openSet.length > 0) {
            // Find node with lowest f score
            let current = openSet[0];
            let currentIdx = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].g + openSet[i].h < current.g + current.h) {
                    current = openSet[i];
                    currentIdx = i;
                }
            }

            if (current.x === endX && current.y === endY) {
                // Reconstruct path
                const path = [];
                let curr = `${endX},${endY}`;
                while (cameFrom[curr]) {
                    const [x, y] = curr.split(',').map(Number);
                    path.unshift({ x, y });
                    curr = cameFrom[curr];
                }
                return path;
            }

            openSet.splice(currentIdx, 1);

            const neighbors = [
                { x: current.x + 1, y: current.y },
                { x: current.x - 1, y: current.y },
                { x: current.x, y: current.y + 1 },
                { x: current.x, y: current.y - 1 },
            ];

            for (const neighbor of neighbors) {
                const tile = this.getTile(neighbor.x, neighbor.y);
                if (!tile) continue;

                const terrain = this.terrainTypes[tile.terrain];
                if (terrain.impassable) continue;

                const tentativeG = gScore[key(current.x, current.y)] + terrain.moveCost;
                const neighborKey = key(neighbor.x, neighbor.y);

                if (!(neighborKey in gScore) || tentativeG < gScore[neighborKey]) {
                    cameFrom[neighborKey] = key(current.x, current.y);
                    gScore[neighborKey] = tentativeG;

                    const openSetItem = openSet.find((item) => item.x === neighbor.x && item.y === neighbor.y);
                    if (!openSetItem) {
                        openSet.push({
                            x: neighbor.x,
                            y: neighbor.y,
                            g: tentativeG,
                            h: heuristic(neighbor.x, neighbor.y),
                        });
                    }
                }
            }
        }

        return []; // No path found
    }

    /**
     * Set up input handlers (mouse clicks for tile selection)
     */
    setupInput() {
        this.scene.input.on('pointerdown', (pointer) => {
            const gridPos = this.screenToGrid(pointer.x, pointer.y);

            // Dispatch tile click event
            this.scene.events.emit('tile-clicked', gridPos);
        });

        this.scene.input.on('pointermove', (pointer) => {
            const gridPos = this.screenToGrid(pointer.x, pointer.y);

            // Update tooltip position and content
            const tile = this.getTile(gridPos.x, gridPos.y);
            if (tile) {
                const terrainInfo = this.terrainTypes[tile.terrain];
                const tooltip = document.getElementById('tooltip');
                tooltip.textContent = `${terrainInfo.name} (Move: ${terrainInfo.moveCost})`;
                tooltip.style.left = pointer.x + 10 + 'px';
                tooltip.style.top = pointer.y + 10 + 'px';
                tooltip.classList.add('active');
            }
        });

        this.scene.input.on('pointerout', () => {
            document.getElementById('tooltip').classList.remove('active');
        });
    }

    /**
     * Clear all highlights
     */
    clearHighlights() {
        this.selectedTile = null;
        this.reachableTiles = [];
        this.attackableTiles = [];
        this.drawHighlights();
    }

    /**
     * Update display with new highlights
     */
    updateHighlights(reachable = [], attackable = [], selected = null) {
        this.reachableTiles = reachable;
        this.attackableTiles = attackable;
        this.selectedTile = selected;
        this.drawHighlights();
    }
}
