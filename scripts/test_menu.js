const path = require('path');
const fs = require('fs');

const cmdDir = path.join(__dirname, '..', 'modules', 'commands');

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

// Load all commands into global.client.commands
const cmdFiles = fs.readdirSync(cmdDir).filter(f => f.endsWith('.js'));
for (const file of cmdFiles) {
  try {
    const mod = require(path.join(cmdDir, file));
    if (mod && mod.config && mod.config.name) {
      global.client.commands.set(mod.config.name, mod);
    }
  } catch (e) {}
}

console.log(`Loaded ${global.client.commands.size} commands.`);

const menuMod = require(path.join(cmdDir, 'menu.js'));

async function test() {
  const sentMsgs = [];
  const mockApi = {
    sendMessage: (msg, tid, cb, mid) => {
      sentMsgs.push(msg);
      if (typeof cb === 'function') {
        cb(null, { messageID: 'msg_' + Date.now(), threadID: tid });
      }
      return Promise.resolve({ messageID: 'msg_' + Date.now() });
    },
    unsendMessage: () => {},
    getThreadInfo: async () => ({ adminIDs: [{ id: '10001' }] })
  };

  const mockEvent = {
    senderID: '10001',
    threadID: '20001',
    messageID: 'mid_init',
    body: '/menu'
  };

  // Test 1: Main menu
  console.log('\n--- TEST 1: /menu ---');
  await menuMod.run({ api: mockApi, event: mockEvent, args: [], permssion: 0 });
  console.log(sentMsgs[sentMsgs.length - 1]);

  // Test 2: Quick game menu
  console.log('\n--- TEST 2: /menu game ---');
  await menuMod.run({ api: mockApi, event: mockEvent, args: ['game'], permssion: 0 });
  console.log(sentMsgs[sentMsgs.length - 1]);

  // Test 3: Specific command info
  console.log('\n--- TEST 3: /menu cauca ---');
  await menuMod.run({ api: mockApi, event: mockEvent, args: ['cauca'], permssion: 0 });
  console.log(sentMsgs[sentMsgs.length - 1]);

  // Test 4: HandleReply Level 1 (select Trò Chơi)
  console.log('\n--- TEST 4: Reply category "1" ---');
  const lastReplyContext = global.client.handleReply[0];
  await menuMod.handleReply({
    handleReply: lastReplyContext,
    api: mockApi,
    event: { senderID: '10001', threadID: '20001', messageID: 'mid_rep1', body: '1' }
  });
  console.log(sentMsgs[sentMsgs.length - 1]);

  // Test 5: HandleReply Level 2 (select command "1")
  console.log('\n--- TEST 5: Reply command "1" ---');
  const cmdReplyContext = global.client.handleReply[global.client.handleReply.length - 1];
  await menuMod.handleReply({
    handleReply: cmdReplyContext,
    api: mockApi,
    event: { senderID: '10001', threadID: '20001', messageID: 'mid_rep2', body: '1' }
  });
  console.log(sentMsgs[sentMsgs.length - 1]);

  console.log('\n✅ ALL MENU TESTS PASSED!');
  process.exit(0);
}

test();
