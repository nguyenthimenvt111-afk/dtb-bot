const fs = require('fs');
const path = require('path');

const cmdDir = path.join(__dirname, '..', 'modules', 'commands');
const files = fs.readdirSync(cmdDir).filter(f => f.endsWith('.js'));

// Mock API and environment
global.client = {
  commands: new Map(),
  events: new Map(),
  cooldowns: new Map(),
  eventRegistered: [],
  handleReply: [],
  handleReaction: [],
  mainPath: path.join(__dirname, '..'),
  configPath: path.join(__dirname, '..', 'config.json'),
  getTime: () => new Date().toLocaleTimeString()
};

global.data = {
  threadInfo: new Map(),
  threadData: new Map(),
  userName: new Map(),
  userBanned: new Map(),
  threadBanned: new Map(),
  commandBanned: new Map(),
  threadAllowNSFW: [],
  allUserID: [],
  allCurrenciesID: [],
  allThreadID: []
};

global.utils = {
  throwError: (cmd, tid, mid) => `Syntax error in ${cmd}`,
  cleanAnsi: (str) => str
};

global.nodemodule = {};
global.config = {
  ADMINBOT: ['1000123456789'],
  NDH: ['1000123456789'],
  PREFIX: '/'
};

const results = [];

for (const file of files) {
  const filePath = path.join(cmdDir, file);
  try {
    const mod = require(filePath);
    if (!mod || !mod.config) continue;

    const cat = mod.config.commandCategory || '';
    const name = mod.config.name || path.basename(file, '.js');

    const isGameCat = /game|trò\s*chơi|minigame|giải\s*trí/i.test(cat);
    const isKnownGame = /^(cauca|doanso|vongquay|dapchuot|taixiu|tx|baucua|slot|banchim|caro|cuop|dhbc|dungeon|gtf|kbb|keobo|masoi|noitu|quiz|quizenglish|thamhiem|ttt|tungdongxu|tutien|xidach|zwar|sieunhan|subnautica|altp|boctham|monster|trai)$/i.test(name);

    if (isGameCat || isKnownGame) {
      const code = fs.readFileSync(filePath, 'utf8');
      
      // Check for dead domains or known issues
      const deadApis = [];
      const urls = code.match(/https?:\/\/[^\s"'`)]+/g) || [];
      
      results.push({
        file,
        name,
        category: cat,
        hasRun: typeof mod.run === 'function',
        hasOnLoad: typeof mod.onLoad === 'function',
        hasHandleReply: typeof mod.handleReply === 'function',
        urls: urls.slice(0, 5),
        codeSize: code.length
      });
    }
  } catch (err) {
    results.push({
      file,
      error: err.message,
      stack: err.stack
    });
  }
}

console.log(`Audited ${results.length} game modules:`);
for (const r of results) {
  if (r.error) {
    console.log(`❌ ERROR LOADING ${r.file}: ${r.error}`);
  } else {
    console.log(`🎮 [${r.name}] (${r.file}) - Cat: "${r.category}" - Run: ${r.hasRun} - URLs: ${r.urls.length}`);
  }
}
