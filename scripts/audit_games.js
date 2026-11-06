const fs = require('fs');
const path = require('path');

const cmdDir = path.join(__dirname, '..', 'modules', 'commands');
const files = fs.readdirSync(cmdDir).filter(f => f.endsWith('.js'));

console.log(`Total command files: ${files.length}`);

const gameCandidates = [];

for (const file of files) {
  const filePath = path.join(cmdDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const catMatch = content.match(/commandCategory\s*:\s*["']([^"']+)["']/i);
    const cat = catMatch ? catMatch[1].trim() : '';
    const nameMatch = content.match(/name\s*:\s*["']([^"']+)["']/i);
    const name = nameMatch ? nameMatch[1].trim() : path.basename(file, '.js');

    const isGameCat = /game|trò\s*chơi|minigame|giải\s*trí|cờ/i.test(cat);
    const isGameName = /^(cauca|doanso|vongquay|dapchuot|taixiu|tx|baucua|slot|banchim|caro|cuop|dhbc|dungeon|gtf|kbb|keobo|masoi|noitu|quiz|quizenglish|thamhiem|ttt|tungdongxu|tutien|xidach|zwar)$/i.test(name);

    if (isGameCat || isGameName) {
      gameCandidates.push({
        file,
        name,
        category: cat,
        filePath
      });
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
}

console.log(`Found ${gameCandidates.length} potential game commands:`);
console.log(JSON.stringify(gameCandidates, null, 2));
