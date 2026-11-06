const fs = require('fs');
const path = require('path');

const cmdDir = path.join(__dirname, '..', 'modules', 'commands');
const files = ['tutien.js', 'dungeon.js', 'thamhiem.js', 'trai.js', 'taixiu.js', 'tx.js'];

files.forEach(f => {
  const p = path.join(cmdDir, f);
  if (fs.existsSync(p)) {
    let s = fs.readFileSync(p, 'utf8');
    s = s.replace(/commandCategory\s*:\s*["']Game["']/gi, 'commandCategory: "Trò Chơi"');
    fs.writeFileSync(p, s, 'utf8');
    console.log(`Updated category for ${f} -> "Trò Chơi"`);
  }
});
