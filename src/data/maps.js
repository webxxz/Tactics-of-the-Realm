/**
 * maps.js — Battle Map Layouts & Unit Spawn Positions
 */

const MAPS = [
    {
        id: 'map_01',
        name: 'Tutorial Battle',
        width: 10,
        height: 10,
        playerUnits: [
            { type: 'Soldier', position: { x: 1, y: 8 } },
            { type: 'Knight', position: { x: 1, y: 9 } },
            { type: 'Ranger', position: { x: 2, y: 8 } },
            { type: 'Rogue', position: { x: 2, y: 9 } },
        ],
        enemyUnits: [
            { type: 'Soldier', position: { x: 8, y: 1 } },
            { type: 'Knight', position: { x: 8, y: 0 } },
            { type: 'Ranger', position: { x: 7, y: 1 } },
            { type: 'Rogue', position: { x: 7, y: 0 } },
        ],
        difficulty: 'easy',
        goldReward: 100,
    },
];
