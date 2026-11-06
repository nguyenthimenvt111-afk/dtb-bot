const fs = require('fs-extra');
const path = require('path');

const cmdDir = path.join(__dirname, '..', 'modules', 'commands');

global.client = {
  commands: new Map(),
  events: new Map(),
  cooldowns: new Map(),
  eventRegistered: [],
  handleReply: [],
  handleReaction: [],
  xidach_otm_nobot: {},
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
  allUserID: ['10001'],
  allCurrenciesID: ['10001'],
  allThreadID: ['10002']
};

global.utils = {
  throwError: (cmd, tid, mid) => `Syntax error in ${cmd}`,
  cleanAnsi: (str) => str
};

global.config = {
  ADMINBOT: ['10001'],
  NDH: ['10001'],
  PREFIX: '/'
};

global.configModule = {
  xidach: { maxPlayers: 5 }
};

const mockCurrencies = {
  getData: async (uid) => ({ money: 1000000, exp: 500, data: {} }),
  setData: async (uid, data) => true,
  increaseMoney: async (uid, m) => true,
  decreaseMoney: async (uid, m) => true
};

const mockUsers = {
  getData: async (uid) => ({ name: 'TestUser', data: {} }),
  getNameUser: async (uid) => 'TestUser'
};

const mockThreads = {
  getData: async (tid) => ({ threadInfo: { threadName: 'TestGroup' } })
};

async function testCmd(cmdName, args) {
  const mod = require(path.join(cmdDir, `${cmdName}.js`));
  let sent = null;
  const mockApi = {
    sendMessage: (msg, tid, cb, mid) => {
      sent = msg;
      return Promise.resolve({ messageID: 'mid_123' });
    }
  };
  const mockEvent = {
    senderID: '10001',
    threadID: '10002',
    messageID: 'mid_000',
    type: 'message',
    isGroup: true,
    participantIDs: ['10001', '10002'],
    body: `/${cmdName} ${args.join(' ')}`
  };

  await mod.run({
    api: mockApi,
    event: mockEvent,
    args,
    Currencies: mockCurrencies,
    Users: mockUsers,
    Threads: mockThreads,
    permssion: 0,
    getText: (...k) => k.join(' ')
  });

  return sent;
}

async function main() {
  const cmds = ['xidach', 'zwar', 'altp', 'cuop', 'boctham', 'keobo', 'taixiu', 'tx', 'baucua', 'slot', 'kbb', 'ttt', 'tungdongxu', 'cauca', 'doanso', 'vongquay', 'dapchuot'];
  for (const c of cmds) {
    try {
      const res = await testCmd(c, []);
      console.log(`[PASS] ${c}: ${typeof res === 'string' ? res.slice(0, 50).replace(/\n/g, ' ') : (res ? 'object' : 'sent')}`);
    } catch (e) {
      console.log(`[FAIL] ${c}: ${e.message}`);
    }
  }
  process.exit(0);
}

main();
