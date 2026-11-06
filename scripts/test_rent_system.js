const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

const rentCmd = require("../modules/commands/rent.js");
const keyCmd = require("../modules/commands/key.js");

const testTID = "999888777666";
const testUID = "1000888999";
const adminUID = "61571815250014";

global.config = {
  ADMINBOT: [adminUID],
  PREFIX: "/"
};

global.data = {
  threadData: new Map()
};

let lastMsg = null;
const mockApi = {
  sendMessage: (msg, tid, cb, mid) => {
    lastMsg = msg;
    if (typeof cb === "function") cb(null, { messageID: "mid_" + Date.now() });
    return Promise.resolve({ messageID: "mid_" + Date.now() });
  },
  getThreadInfo: async (tid) => ({
    threadName: "Nhóm Test Báo Thủ",
    participantIDs: [testUID, adminUID]
  })
};

async function run() {
  console.log("=== BẮT ĐẦU TEST TOÀN DIỆN HỆ THỐNG RENT & KEY ===\n");

  // Xóa testTID nếu còn tồn tại từ lần chạy trước
  const rentsFile = path.join(__dirname, "../modules/commands/cache/rentbot/rents.json");
  let curRents = fs.readJsonSync(rentsFile);
  curRents = curRents.filter(r => String(r.tid) !== testTID);
  fs.writeJsonSync(rentsFile, curRents, { spaces: 2 });

  // 1. Menu hướng dẫn
  console.log("--- TEST 1: /rent (Menu hướng dẫn) ---");
  await rentCmd.run({
    api: mockApi,
    event: { threadID: testTID, senderID: testUID, messageID: "m1" },
    args: []
  });
  console.log(lastMsg.slice(0, 150) + "...\n");
  if (!lastMsg.includes("HỆ THỐNG THUÊ BOT DTB")) throw new Error("Menu test failed");

  // 2. Admin tạo key
  console.log("--- TEST 2: /rent key 30 2 (Admin tạo 2 key 30 ngày) ---");
  await rentCmd.run({
    api: mockApi,
    event: { threadID: testTID, senderID: adminUID, messageID: "m2" },
    args: ["key", "30", "2"]
  });
  console.log(lastMsg + "\n");
  if (!lastMsg.includes("TẠO KEY THÀNH CÔNG")) throw new Error("Key creation failed");

  // Lấy key vừa tạo
  const keysFile = path.join(__dirname, "../modules/commands/cache/rentbot/keys.json");
  const keys = fs.readJsonSync(keysFile);
  const newKeys = keys.filter(k => !k.used && k.key.startsWith("DTB-"));
  if (newKeys.length < 2) throw new Error("Expected at least 2 unused DTB keys");
  const testKey1 = newKeys[newKeys.length - 2].key;
  const testKey2 = newKeys[newKeys.length - 1].key;
  console.log(`Key 1: ${testKey1}, Key 2: ${testKey2}`);

  // 3. Admin kiểm tra danh sách key
  console.log("\n--- TEST 3: /rent check (Xem danh sách key) ---");
  await rentCmd.run({
    api: mockApi,
    event: { threadID: testTID, senderID: adminUID, messageID: "m3" },
    args: ["check"]
  });
  console.log(lastMsg.slice(0, 200) + "...\n");

  // 4. Kích hoạt key vào nhóm test
  console.log(`--- TEST 4: /rent ${testKey1} (Kích hoạt nhóm) ---`);
  await rentCmd.run({
    api: mockApi,
    event: { threadID: testTID, senderID: testUID, messageID: "m4" },
    args: [testKey1]
  });
  console.log(lastMsg + "\n");
  if (!lastMsg.includes("KÍCH HOẠT THÀNH CÔNG")) throw new Error("Activation failed");

  // 5. Kiểm tra thông tin hạn dùng nhóm
  console.log("--- TEST 5: /rent info (Xem hạn nhóm vừa kích hoạt) ---");
  await rentCmd.run({
    api: mockApi,
    event: { threadID: testTID, senderID: testUID, messageID: "m5" },
    args: ["info"]
  });
  console.log(lastMsg + "\n");
  if (!lastMsg.includes("Đang hoạt động (Còn 30 ngày)")) throw new Error("Info check failed");

  // 6. Thử kích hoạt lại key đã dùng
  console.log(`--- TEST 6: /rent ${testKey1} (Kích hoạt lại key đã dùng) ---`);
  await rentCmd.run({
    api: mockApi,
    event: { threadID: testTID, senderID: testUID, messageID: "m6" },
    args: [testKey1]
  });
  console.log(lastMsg + "\n");
  if (!lastMsg.includes("đã được kích hoạt trước đó")) throw new Error("Re-use key check failed");

  // 7. Nhập key thứ 2 qua lệnh /key (cộng dồn hạn dùng)
  console.log(`--- TEST 7: /key ${testKey2} (Gia hạn qua lệnh /key) ---`);
  await keyCmd.run({
    api: mockApi,
    event: { threadID: testTID, senderID: testUID, messageID: "m7" },
    args: [testKey2]
  });
  console.log(lastMsg + "\n");
  if (!lastMsg.includes("KÍCH HOẠT THÀNH CÔNG")) throw new Error("Key module extension failed");

  // 8. Kiểm tra hạn sau khi cộng dồn
  console.log("--- TEST 8: /key info (Sau khi cộng dồn) ---");
  await keyCmd.run({
    api: mockApi,
    event: { threadID: testTID, senderID: testUID, messageID: "m8" },
    args: ["info"]
  });
  console.log(lastMsg + "\n");
  if (!lastMsg.includes("Còn 60 ngày")) throw new Error("Accumulation check failed");

  // 9. Admin cộng thêm ngày trực tiếp /rent add
  console.log(`--- TEST 9: /rent add ${testTID} 10 (Admin cộng 10 ngày) ---`);
  await rentCmd.run({
    api: mockApi,
    event: { threadID: testTID, senderID: adminUID, messageID: "m9" },
    args: ["add", testTID, "10"]
  });
  console.log(lastMsg + "\n");
  if (!lastMsg.includes("cộng thành công 10 ngày")) throw new Error("Admin add days failed");

  // 10. Dọn dẹp dữ liệu nhóm test
  console.log("--- TEST 10: /rent delrent (Admin xóa nhóm test khỏi DB) ---");
  await rentCmd.run({
    api: mockApi,
    event: { threadID: testTID, senderID: adminUID, messageID: "m10" },
    args: ["delrent", testTID]
  });
  console.log(lastMsg + "\n");

  console.log("✅ TẤT CẢ 10/10 TEST CỦA HỆ THỐNG RENT & KEY ĐỀU PASS 100%!");
  process.exit(0);
}

run().catch(err => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
