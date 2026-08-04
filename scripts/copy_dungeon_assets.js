const fs = require('fs');
const path = require('path');

const srcFrames = path.join(__dirname, '../0x72_DungeonTilesetII_v1.7/0x72_DungeonTilesetII_v1.7/frames');
const srcRoot = path.join(__dirname, '../0x72_DungeonTilesetII_v1.7/0x72_DungeonTilesetII_v1.7');

const destBase = path.join(__dirname, '../public/assets/dungeon');
const destHeroes = path.join(destBase, 'heroes');
const destWeapons = path.join(destBase, 'weapons');
const destChests = path.join(destBase, 'chests');
const destMonsters = path.join(destBase, 'monsters');
const destTiles = path.join(destBase, 'tiles');
const destUi = path.join(destBase, 'ui');

const itemWeapons = path.join(__dirname, '../public/assets/items/weapons');

[destHeroes, destWeapons, destChests, destMonsters, destTiles, destUi, itemWeapons].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

if (fs.existsSync(srcRoot)) {
  ['0x72_DungeonTilesetII_v1.7.png', 'atlas_floor-16x16.png', 'atlas_walls_high-16x32.png', 'atlas_walls_low-16x16.png'].forEach((file) => {
    const srcFile = path.join(srcRoot, file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(destTiles, file));
    }
  });
}

if (fs.existsSync(srcFrames)) {
  const files = fs.readdirSync(srcFrames);
  files.forEach((file) => {
    const srcFile = path.join(srcFrames, file);
    if (!file.endsWith('.png')) return;

    if (file.startsWith('knight_') || file.startsWith('elf_') || file.startsWith('wizzard_') || file.startsWith('dwarf_') || file.startsWith('lizard_')) {
      fs.copyFileSync(srcFile, path.join(destHeroes, file));
    } else if (file.startsWith('weapon_')) {
      fs.copyFileSync(srcFile, path.join(destWeapons, file));
      fs.copyFileSync(srcFile, path.join(itemWeapons, file));
    } else if (file.startsWith('chest_')) {
      fs.copyFileSync(srcFile, path.join(destChests, file));
    } else if (file.startsWith('flask_') || file.startsWith('ui_') || file.startsWith('coin_')) {
      fs.copyFileSync(srcFile, path.join(destUi, file));
    } else if (
      file.startsWith('big_') ||
      file.startsWith('ogre_') ||
      file.startsWith('chort_') ||
      file.startsWith('goblin_') ||
      file.startsWith('imp_') ||
      file.startsWith('ice_zombie') ||
      file.startsWith('masked_orc') ||
      file.startsWith('muddy_') ||
      file.startsWith('necromancer_') ||
      file.startsWith('orc_') ||
      file.startsWith('pumpkin_dude') ||
      file.startsWith('skelet_') ||
      file.startsWith('slug_') ||
      file.startsWith('swampy_') ||
      file.startsWith('tiny_') ||
      file.startsWith('wogol_') ||
      file.startsWith('zombie_')
    ) {
      fs.copyFileSync(srcFile, path.join(destMonsters, file));
    }
  });
}

console.log('Successfully copied all 0x72 Dungeon Tileset II assets to public/assets/dungeon!');
