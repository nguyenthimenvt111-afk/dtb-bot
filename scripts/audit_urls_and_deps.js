const fs = require('fs');
const path = require('path');
const axios = require('axios');

const cmdDir = path.join(__dirname, '..', 'modules', 'commands');

const gameFiles = [
  'altp.js', 'banchim.js', 'baucua.js', 'boctham.js', 'caro.js',
  'cauca.js', 'cuop.js', 'dapchuot.js', 'dhbc.js', 'doanso.js',
  'dungeon.js', 'gtf.js', 'kbb.js', 'keobo.js', 'masoi.js',
  'minecraft.js', 'monster.js', 'noitu.js', 'quiz.js', 'quizenglish.js',
  'sieunhan.js', 'slot.js', 'subnautica.js', 'taixiu.js', 'thamhiem.js',
  'trai.js', 'ttt.js', 'tungdongxu.js', 'tutien.js', 'tx.js',
  'vongquay.js', 'xidach.js', 'zwar.js'
];

async function checkUrl(url) {
  try {
    const res = await axios.head(url, { timeout: 4000, validateStatus: () => true });
    return { ok: res.status < 400, status: res.status };
  } catch (e) {
    try {
      const res = await axios.get(url, { timeout: 4000, validateStatus: () => true });
      return { ok: res.status < 400, status: res.status };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
}

async function audit() {
  console.log(`Starting in-depth audit of ${gameFiles.length} games...\n`);
  const report = [];

  for (const file of gameFiles) {
    const filePath = path.join(cmdDir, file);
    if (!fs.existsSync(filePath)) {
      report.push({ file, status: 'FILE_NOT_FOUND' });
      continue;
    }

    const code = fs.readFileSync(filePath, 'utf8');
    let mod;
    try {
      mod = require(filePath);
    } catch (e) {
      report.push({ file, status: 'LOAD_ERROR', error: e.message });
      continue;
    }

    // Extract all HTTP URLs
    const rawUrls = code.match(/https?:\/\/[^\s"'`)]+/g) || [];
    // Filter out common public libraries or doc links
    const apiUrls = rawUrls.filter(u => !u.includes('facebook.com') && !u.includes('github.com/dtb') && !u.includes('schema.org'));

    // Check external URLs if this command relies on them
    const urlChecks = [];
    for (const u of apiUrls.slice(0, 3)) { // test first 3
      // Clean trailing punctuation
      const cleanUrl = u.replace(/[;,\.\)]+$/, '');
      const res = await checkUrl(cleanUrl);
      urlChecks.push({ url: cleanUrl, res });
    }

    // Check if the command requires any missing local files
    const missingFiles = [];
    const requireMatches = code.match(/require\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g) || [];
    for (const req of requireMatches) {
      const sub = req.match(/['"](\.[^'"]+)['"]/)[1];
      const resolved = path.resolve(cmdDir, sub);
      if (!fs.existsSync(resolved) && !fs.existsSync(resolved + '.js') && !fs.existsSync(resolved + '.json')) {
        missingFiles.push(sub);
      }
    }

    report.push({
      file,
      name: mod.config ? mod.config.name : 'Unknown',
      category: mod.config ? mod.config.commandCategory : 'Unknown',
      description: mod.config ? mod.config.description : '',
      missingFiles,
      urlChecks,
      codeLength: code.length
    });
  }

  console.log('AUDIT RESULTS:');
  for (const item of report) {
    console.log(`\n-----------------------------------------`);
    console.log(`File: ${item.file} | Name: [${item.name}] | Cat: ${item.category}`);
    if (item.status) {
      console.log(`  STATUS: ${item.status} (${item.error || ''})`);
    }
    if (item.missingFiles && item.missingFiles.length > 0) {
      console.log(`  MISSING LOCAL FILES: ${item.missingFiles.join(', ')}`);
    }
    if (item.urlChecks && item.urlChecks.length > 0) {
      for (const uc of item.urlChecks) {
        console.log(`  URL: ${uc.url} -> ${uc.res.ok ? 'OK (' + uc.res.status + ')' : 'FAIL: ' + JSON.stringify(uc.res)}`);
      }
    }
  }

  process.exit(0);
}

audit().catch(e => {
  console.error(e);
  process.exit(1);
});
