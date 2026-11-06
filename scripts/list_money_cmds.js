const fs = require('fs');
const path = require('path');

const cmdDir = path.join(__dirname, '..', 'modules', 'commands');
const files = fs.readdirSync(cmdDir).filter(f => f.endsWith('.js'));

const moneyList = [];

for (const file of files) {
  const filePath = path.join(cmdDir, file);
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const mod = require(filePath);
    if (!mod || !mod.config) continue;

    const name = mod.config.name;
    const cat = mod.config.commandCategory || '';
    const desc = mod.config.description || '';
    const usages = mod.config.usages || '';
    const perm = mod.config.hasPermssion !== undefined ? mod.config.hasPermssion : (mod.config.hasPermission || 0);

    const hasCurrencies = /Currencies\.(increaseMoney|decreaseMoney|setData|getData)/.test(code);
    const mentionsMoney = /tiền|money|coin|xu|đô|ngân hàng|bank|atm|ví|số dư|lương|chuyển tiền|pay/i.test(name + ' ' + desc + ' ' + usages);

    if (hasCurrencies || mentionsMoney) {
      moneyList.push({
        name,
        file,
        category: cat,
        perm,
        desc: desc.split('\n')[0],
        usages,
        hasCurrencies
      });
    }
  } catch (e) {}
}

console.log(`Found ${moneyList.length} money commands.`);
fs.writeFileSync(path.join(__dirname, 'money_commands.json'), JSON.stringify(moneyList, null, 2), 'utf8');
process.exit(0);
