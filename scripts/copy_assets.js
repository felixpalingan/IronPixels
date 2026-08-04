const fs = require('fs');
const path = require('path');

const shieldDir = path.join(__dirname, '../public/assets/items/shields');
const amuletDir = path.join(__dirname, '../public/assets/items/amulets');
const weaponDir = path.join(__dirname, '../public/assets/items/weapons');

fs.mkdirSync(shieldDir, { recursive: true });
fs.mkdirSync(amuletDir, { recursive: true });
fs.mkdirSync(weaponDir, { recursive: true });

for (let i = 1; i <= 36; i++) {
  const src = path.join(__dirname, `../free-shield-and-amulet-rpg-icons/PNG/Transperent/Icon${i}.png`);
  const dest = path.join(shieldDir, `Icon${i}.png`);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

for (let i = 37; i <= 48; i++) {
  const src = path.join(__dirname, `../free-shield-and-amulet-rpg-icons/PNG/Transperent/Icon${i}.png`);
  const dest = path.join(amuletDir, `Icon${i}.png`);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

const wpnSource = path.join(__dirname, '../SnoopethDuckDuck Swords and Staffs/Pack 1/0px');
if (fs.existsSync(wpnSource)) {
  const files = fs.readdirSync(wpnSource);
  files.forEach((file) => {
    if (file.endsWith('.png')) {
      fs.copyFileSync(path.join(wpnSource, file), path.join(weaponDir, file));
    }
  });
}
