const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

console.log('=== INSPECTING includes/data.sqlite ===');
const db = new sqlite3.Database('includes/data.sqlite');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error getting tables:', err);
    process.exit(1);
  }
  console.log('Tables:', tables.map(t => t.name));
  
  let done = 0;
  tables.forEach(t => {
    db.get(`SELECT count(*) as count FROM ${t.name}`, (e, countRes) => {
      console.log(`Table ${t.name}: ${countRes ? countRes.count : 0} rows`);
      
      // Get columns
      db.all(`PRAGMA table_info(${t.name})`, (pe, cols) => {
        console.log(`  Columns for ${t.name}:`, cols.map(c => c.name));
        
        // Sample latest rows or today's rows
        db.all(`SELECT * FROM ${t.name} ORDER BY updatedAt DESC LIMIT 5`, (se, rows) => {
          if (!se && rows) {
            console.log(`  Sample 5 latest rows from ${t.name}:`);
            rows.forEach(row => {
              console.log(`    - ID: ${row.userID || row.threadID || row.id}, Name: ${row.name || 'N/A'}, updatedAt: ${row.updatedAt}, createdAt: ${row.createdAt}`);
            });
          }
          done++;
          if (done === tables.length) {
            checkTodayActivity();
          }
        });
      });
    });
  });
});

function checkTodayActivity() {
  console.log('\n=== CHECKING TODAY (07/11/2026 or latest dates) ACTIVITY ===');
  // Check any updated today or recent
  db.all("SELECT * FROM Users ORDER BY updatedAt DESC LIMIT 10", (err, users) => {
    if (users) {
      console.log('\nTop 10 recently updated Users:');
      users.forEach(u => {
        console.log(`  UID: ${u.userID} | Name: ${u.name} | updated: ${u.updatedAt} | created: ${u.createdAt}`);
      });
    }

    db.all("SELECT * FROM Threads ORDER BY updatedAt DESC LIMIT 10", (err, threads) => {
      if (threads) {
        console.log('\nTop 10 recently updated Threads:');
        threads.forEach(t => {
          console.log(`  TID: ${t.threadID} | updated: ${t.updatedAt} | created: ${t.createdAt}`);
        });
      }

      process.exit(0);
    });
  });
}
