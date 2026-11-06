const fs = require('fs-extra');
const path = require('path');

const cmdDir = path.join(__dirname, '..', 'modules', 'commands');

const gameList = [
  'altp.js', 'banchim.js', 'baucua.js', 'boctham.js', 'caro.js',
  'cauca.js', 'cuop.js', 'dapchuot.js', 'dhbc.js', 'doanso.js',
  'dungeon.js', 'kbb.js', 'keobo.js', 'masoi.js', 'minecraft.js',
  'monster.js', 'noitu.js', 'quiz.js', 'quizenglish.js', 'sieunhan.js',
  'slot.js', 'subnautica.js', 'taixiu.js', 'thamhiem.js', 'trai.js',
  'ttt.js', 'tungdongxu.js', 'tutien.js', 'tx.js', 'vongquay.js',
  'xidach.js', 'zwar.js'
];

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
  allUserID: ['10001'],
  allCurrenciesID: ['10001'],
  allThreadID: ['10002']
};

global.utils = {
  throwError: (cmd, tid, mid) => `Syntax error in ${cmd}`,
  cleanAnsi: (str) => str
};

global.nodemodule = {};
global.config = {
  ADMINBOT: ['10001'],
  NDH: ['10001'],
  PREFIX: '/'
};

const mockCurrencies = {
  getData: async (uid) => ({ money: 1000000, exp: 500 }),
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

async function testGame(file) {
  const filePath = path.join(cmdDir, file);
  if (!fs.existsSync(filePath)) {
    return { status: 'MISSING' };
  }

  let mod;
  try {
    delete require.cache[require.resolve(filePath)];
    mod = require(filePath);
  } catch (e) {
    return { status: 'LOAD_FAIL', error: e.message };
  }

  if (typeof mod.onLoad === 'function') {
    try {
      await mod.onLoad();
    } catch (e) {
      return { status: 'ONLOAD_FAIL', error: e.message };
    }
  }

  const messagesSent = [];
  const mockApi = {
    sendMessage: (msg, tid, cb, mid) => {
      messagesSent.push(msg);
      // Asynchronous callback after stream would finish reading
      if (typeof cb === 'function') {
        setTimeout(() => {
          try { cb(null, { messageID: 'mid_mock_123', threadID: tid }); } catch (e) {}
        }, 100);
      }
      return Promise.resolve({ messageID: 'mid_mock_123' });
    },
    changeNickname: () => {},
    getUserInfo: (uid, cb) => { if (cb) cb(null, { [uid]: { name: 'TestUser' } }); },
    unsendMessage: () => {}
  };

  const mockEvent = {
    senderID: '10001',
    threadID: '10002',
    messageID: 'mid_000',
    type: 'message',
    isGroup: true,
    participantIDs: ['10001', '10002'],
    body: `/${mod.config ? mod.config.name : file}`
  };

  try {
    // Test 1: Run with no args
    await mod.run({
      api: mockApi,
      event: mockEvent,
      args: [],
      Currencies: mockCurrencies,
      Users: mockUsers,
      Threads: mockThreads,
      permssion: 0
    });

    // Test 2: If no messages sent with no args, test with 'help' or sample arg
    if (messagesSent.length === 0) {
      await mod.run({
        api: mockApi,
        event: mockEvent,
        args: ['help'],
        Currencies: mockCurrencies,
        Users: mockUsers,
        Threads: mockThreads,
        permssion: 0
      });
    }

    return {
      status: 'OK',
      messagesSent: messagesSent.length,
      sampleMsg: typeof messagesSent[0] === 'string' ? messagesSent[0].slice(0, 100) : (messagesSent[0] ? 'object/stream' : 'none')
    };
  } catch (e) {
    return {
      status: 'RUNTIME_ERROR',
      error: e.message,
      stack: e.stack ? e.stack.split('\n')[1] : ''
    };
  }
}

async function run() {
  console.log('Testing execution of games:\n');
  const summary = [];
  for (const file of gameList) {
    try {
      const res = await testGame(file);
      summary.push({ file, ...res });
      console.log(`[${res.status}] ${file}: ${res.error || (res.messagesSent + ' msgs sent')}`);
    } catch (err) {
      summary.push({ file, status: 'FATAL', error: err.message });
      console.log(`[FATAL] ${file}: ${err.message}`);
    }
  }
  fs.writeFileSync(path.join(__dirname, 'test_results.json'), JSON.stringify(summary, null, 2));
  setTimeout(() => process.exit(0), 500);
}

run();
