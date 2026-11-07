const fs = require('fs');
const path = require('path');

console.log('=== 1. APPSTATE.JSON ===');
try {
  if (fs.existsSync('appstate.json')) {
    const appstate = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
    console.log('Appstate is array:', Array.isArray(appstate));
    if (Array.isArray(appstate)) {
      console.log('Total cookies in appstate:', appstate.length);
      const cUser = appstate.find(c => c.key === 'c_user');
      const xs = appstate.find(c => c.key === 'xs');
      console.log('Logged in Facebook UID (c_user):', cUser ? cUser.value : 'None');
      console.log('Has xs session cookie:', !!xs);
    }
  } else {
    console.log('appstate.json not found!');
  }
} catch (e) {
  console.log('Error reading appstate.json:', e.message);
}

console.log('\n=== 2. FCA / HORIZON DATABASE DIRECTORIES ===');
function listDir(dir) {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    console.log(`Directory ${dir} (${files.length} items):`, files);
    for (const f of files.slice(0, 5)) {
      const p = path.join(dir, f);
      const stat = fs.statSync(p);
      if (stat.isFile() && f.endsWith('.json')) {
        try {
          const content = fs.readFileSync(p, 'utf8');
          console.log(`  File ${f} (${content.length} bytes):`, content.slice(0, 100));
        } catch (_) {}
      }
    }
  } else {
    console.log(`Directory ${dir} not found.`);
  }
}

listDir('Fca_Database');
listDir('Horizon_Database');

console.log('\n=== 3. SQLITE DATABASE ===');
try {
  const sqlite3 = require('sqlite3');
  const db = new sqlite3.Database('data.sqlite');
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.log('Sqlite error:', err.message);
    } else {
      console.log('Tables in data.sqlite:', tables.map(t => t.name));
      if (tables.length === 0) {
        console.log('No tables in data.sqlite');
      }
      let pending = tables.length;
      if (pending === 0) process.exit(0);
      tables.forEach(t => {
        db.all(`SELECT * FROM ${t.name} LIMIT 5`, (e, rows) => {
          if (e) {
            console.log(`Error querying ${t.name}:`, e.message);
          } else {
            console.log(`Table ${t.name} (sample ${rows.length} rows):`, JSON.stringify(rows).slice(0, 200));
          }
          pending--;
          if (pending === 0) process.exit(0);
        });
      });
    }
  });
} catch (e) {
  console.log('Sqlite load error:', e.message);
  process.exit(0);
}
