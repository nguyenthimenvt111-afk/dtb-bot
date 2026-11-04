// modules/commands/tutien.js
// Game Tu Tiên hoàn chỉnh - Phiên bản đặc sắc
// Credits: dtb
// Cách dùng: /tutien [thamgia|info|tu|auto|nv|tongmon|shop|cheta|san|pvp|rank|top|ls|admin]

const fs = require("fs-extra");
const path = require("path");

const dataPath = path.join(__dirname, "..", "tutienData", "tutien.json");
const autoCultivatePath = path.join(__dirname, "..", "tutienData", "auto.json");

// ===== FILE DATA =====
function ensureDataFile() {
  const dirPath = path.dirname(dataPath);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({}, null, 2));
  if (!fs.existsSync(autoCultivatePath)) fs.writeFileSync(autoCultivatePath, JSON.stringify({}, null, 2));
}

function loadData() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(dataPath));
}

function saveData(data) {
  ensureDataFile();
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function loadAutoData() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(autoCultivatePath));
}

function saveAutoData(data) {
  ensureDataFile();
  fs.writeFileSync(autoCultivatePath, JSON.stringify(data, null, 2));
}

// ===== HỆ THỐNG CẢNH GIỚI =====
const canhGiois = [
  { name: "Phàm Nhân", require: 0, hp: 100, mp: 50, satThuong: 10, phongThu: 5 },
  { name: "Luyện Khí", require: 1000, hp: 200, mp: 100, satThuong: 20, phongThu: 10 },
  { name: "Trúc Cơ", require: 3000, hp: 400, mp: 200, satThuong: 40, phongThu: 20 },
  { name: "Kim Đan", require: 6000, hp: 800, mp: 400, satThuong: 80, phongThu: 40 },
  { name: "Nguyên Anh", require: 12000, hp: 1600, mp: 800, satThuong: 160, phongThu: 80 },
  { name: "Hóa Thần", require: 25000, hp: 3200, mp: 1600, satThuong: 320, phongThu: 160 },
  { name: "Hợp Thể", require: 50000, hp: 6400, mp: 3200, satThuong: 640, phongThu: 320 },
  { name: "Đại Thừa", require: 100000, hp: 12800, mp: 6400, satThuong: 1280, phongThu: 640 },
  { name: "Độ Kiếp", require: 200000, hp: 25600, mp: 12800, satThuong: 2560, phongThu: 1280 },
  { name: "Chân Tiên", require: 500000, hp: 51200, mp: 25600, satThuong: 5120, phongThu: 2560 },
  { name: "Kim Tiên", require: 1000000, hp: 102400, mp: 51200, satThuong: 10240, phongThu: 5120 },
  { name: "Đại La Kim Tiên", require: 2000000, hp: 204800, mp: 102400, satThuong: 20480, phongThu: 10240 },
  { name: "Thiên Tiên", require: 5000000, hp: 409600, mp: 204800, satThuong: 40960, phongThu: 20480 },
  { name: "Chí Tôn", require: 10000000, hp: 819200, mp: 409600, satThuong: 81920, phongThu: 40960 },
  { name: "Thần", require: 50000000, hp: 999999, mp: 999999, satThuong: 99999, phongThu: 99999 }
];

// ===== KỸ NĂNG THEO CẢNH GIỚI =====
const kyNangTheoCanhGioi = {
  "Phàm Nhân": ["Quyền Cước", "Ném Đá"],
  "Luyện Khí": ["Hỏa Cầu Thuật", "Kim Cang Chú"],
  "Trúc Cơ": ["Phi Kiếm Thuật", "Băng Phong Thuật"],
  "Kim Đan": ["Tử Vi Thần Kiếm", "Càn Khôn Đại Na Di"],
  "Nguyên Anh": ["Phân Thân Thuật", "Thiên Lôi Hàng Thế"],
  "Hóa Thần": ["Diệt Thần Chỉ", "Hư Không Đại Pháp"],
  "Hợp Thể": ["Vạn Kiếp Bất Diệt", "Hỗn Độn Chưởng"],
  "Đại Thừa": ["Khai Thiên Tích Địa", "Luân Hồi Chuyển Thế"],
  "Độ Kiếp": ["Chí Tôn Thần Lôi", "Thiên Địa Đồng Thọ"],
  "Chân Tiên": ["Tiên Giới Chi Lực", "Thần Thông Biến Hóa"],
  "Kim Tiên": ["Bất Diệt Kim Thân", "Nhất Niệm Sinh Hoa"],
  "Đại La Kim Tiên": ["Đại La Kiếm Trận", "Thiên Đạo Luân Hồi"],
  "Thiên Tiên": ["Thiên Mệnh Chi Nhãn", "Vạn Pháp Quy Tông"],
  "Chí Tôn": ["Chí Tôn Thần Quyền", "Vũ Trụ Hồng Hoang"],
  "Thần": ["Sáng Thế Chi Lực", "Hủy Diệt Chi Nhãn"]
};

// ===== TÔNG MÔN =====
const tongMons = [
  { 
    name: "Thiên Kiếm Tông", 
    desc: "Chuyên tu kiếm đạo, công kích mạnh mẽ", 
    heSoTL: 1.2,
    kyNang: ["Phi Kiếm Thuật", "Thiên Kiếm Trận", "Vạn Kiếm Quy Tông"]
  },
  { 
    name: "Phù Lục Các", 
    desc: "Tinh thông phù chú, đan dược", 
    heSoTL: 1.1,
    kyNang: ["Phù Chú Thuật", "Luyện Đan Thuật", "Trận Pháp"]
  },
  { 
    name: "Ma Môn", 
    desc: "Tu luyện tà đạo, tốc độ nhanh nhưng dễ tẩu hỏa", 
    heSoTL: 1.4,
    kyNang: ["Huyết Ma Công", "Thiên Ma Đại Pháp", "Tà Vương Chỉ"]
  },
  { 
    name: "Phật Môn", 
    desc: "Từ bi làm gốc, phòng thủ cao", 
    heSoTL: 1.0,
    kyNang: ["Kim Cang Bất Hoại", "Phật Quang Phổ Chiếu", "Đại Bi Chú"]
  },
  { 
    name: "Tán Tu", 
    desc: "Tự do tự tại, không ràng buộc", 
    heSoTL: 0.9,
    kyNang: ["Tự Do Chi Đạo", "Vạn Pháp Tự Nhiên"]
  }
];

// ===== PHÁP BẢO =====
const phapBao = [
  { name: "Phi Kiếm", gia: 5000, satThuong: 50, phongThu: 0, hp: 0, capDo: 1 },
  { name: "Pháp Bào", gia: 8000, satThuong: 0, phongThu: 40, hp: 0, capDo: 1 },
  { name: "Linh Thú", gia: 15000, satThuong: 0, phongThu: 0, hp: 200, capDo: 2 },
  { name: "Huyền Kiếm", gia: 30000, satThuong: 200, phongThu: 0, hp: 0, capDo: 3 },
  { name: "Tiên Giáp", gia: 50000, satThuong: 0, phongThu: 150, hp: 0, capDo: 3 },
  { name: "Thần Thú", gia: 100000, satThuong: 0, phongThu: 0, hp: 1000, capDo: 4 },
  { name: "Thiên Kiếm", gia: 200000, satThuong: 500, phongThu: 0, hp: 0, capDo: 5 },
  { name: "Đế Giáp", gia: 500000, satThuong: 0, phongThu: 400, hp: 0, capDo: 5 }
];

// ===== ĐAN DƯỢC =====
const danDuoc = [
  { name: "Tụ Khí Đan", gia: 1000, tangTuVi: 100 },
  { name: "Trúc Cơ Đan", gia: 5000, tangTuVi: 600 },
  { name: "Kim Đan", gia: 20000, tangTuVi: 3000 },
  { name: "Nguyên Anh Đan", gia: 80000, tangTuVi: 15000 },
  { name: "Hóa Thần Đan", gia: 200000, tangTuVi: 50000 },
  { name: "Tiên Đan", gia: 1000000, tangTuVi: 300000 }
];

// ===== QUÁI VẬT =====
const quaiVat = [
  { name: "Yêu Thú Cấp 1", hp: 100, satThuong: 20, tuViThuong: 50, tienThuong: 100 },
  { name: "Yêu Thú Cấp 2", hp: 300, satThuong: 50, tuViThuong: 150, tienThuong: 300 },
  { name: "Yêu Thú Cấp 3", hp: 800, satThuong: 120, tuViThuong: 400, tienThuong: 800 },
  { name: "Yêu Vương", hp: 2000, satThuong: 300, tuViThuong: 1000, tienThuong: 2000 },
  { name: "Yêu Hoàng", hp: 5000, satThuong: 800, tuViThuong: 3000, tienThuong: 5000 },
  { name: "Ma Thần", hp: 15000, satThuong: 2000, tuViThuong: 10000, tienThuong: 15000 }
];

// ===== NHIỆM VỤ NGẪU NHIÊN =====
const nhiemVuList = [
  {
    ten: "Truy Tìm Linh Dược",
    moTa: "Sư môn cần {soLuong} gốc Linh Chi ngàn năm để luyện đan",
    yeuCau: ["Linh Chi", "Sâm Vạn Niên"],
    thuong: { tuVi: 500, tien: 1000, danhVong: 50 },
    capDo: 1
  },
  {
    ten: "Hàng Yêu Phục Ma",
    moTa: "Dân làng bị yêu quái {tenQuai} quấy nhiễu",
    yeuCau: ["Đánh Bại Yêu Quái"],
    thuong: { tuVi: 1000, tien: 2000, danhVong: 100 },
    capDo: 2
  },
  {
    ten: "Thám Hiểm Bí Cảnh",
    moTa: "Phát hiện {tenBoiCanh} có thể chứa bảo vật thượng cổ",
    yeuCau: ["Thám Hiểm", "Giải Đố"],
    thuong: { tuVi: 2000, tien: 5000, danhVong: 200 },
    capDo: 3
  },
  {
    ten: "Luận Đạo Với Cao Nhân",
    moTa: "Cao nhân {tenCaoNhan} muốn thử thách đạo tâm của ngươi",
    yeuCau: ["Trả Lời Câu Hỏi", "Ngộ Đạo"],
    thuong: { tuVi: 5000, tien: 10000, danhVong: 500 },
    capDo: 4
  },
  {
    ten: "Chế Tạo Thần Khí",
    moTa: "Rèn luyện {tenThanKhi} từ {vLieu} hiếm có",
    yeuCau: ["Quặng Hiếm", "Lửa Thần", "Kỹ Thuật Rèn"],
    thuong: { tuVi: 10000, tien: 50000, danhVong: 1000 },
    capDo: 5
  },
  {
    ten: "Đại Chiến Ma Giới",
    moTa: "Ma giới xâm lấn, cần {soLuong} tu sĩ tham gia chiến đấu",
    yeuCau: ["Chiến Đấu", "Phối Hợp"],
    thuong: { tuVi: 50000, tien: 100000, danhVong: 5000 },
    capDo: 6
  }
];

// ===== GET PLAYER =====
function getPlayer(uid) {
  let data = loadData();
  if (!data[uid]) {
    // Tạo người chơi mới với đầy đủ thuộc tính
    data[uid] = {
      ten: `Đạo Hữu ${uid.slice(0,8)}`,
      phe: Math.random() < 0.5 ? "Chính Đạo" : "Ma Đạo",
      tuVi: 0,
      canhGioi: "Phàm Nhân",
      tongMon: null,
      tien: 1000,
      tuoi: 16,
      theChat: Math.floor(Math.random() * 100) + 1,
      linhCan: Math.floor(Math.random() * 100) + 1,
      danhVong: 0,
      satThuong: 10,
      phongThu: 5,
      hp: 100,
      hpHienTai: 100,
      mp: 50,
      mpHienTai: 50,
      kyNang: ["Quyền Cước"],
      phapBao: [],
      nhiemVuHienTai: null,
      lichSu: [{ thoiGian: Date.now(), suKien: "Bắt đầu tu tiên", tuVi: 0 }],
      lastUpdate: Date.now()
    };
    saveData(data);
    return data[uid];
  }

  // Đảm bảo người chơi cũ có đủ thuộc tính
  let player = data[uid];
  if (!player.phe) player.phe = Math.random() < 0.5 ? "Chính Đạo" : "Ma Đạo";
  if (!player.theChat) player.theChat = Math.floor(Math.random() * 100) + 1;
  if (!player.linhCan) player.linhCan = Math.floor(Math.random() * 100) + 1;
  if (!player.danhVong) player.danhVong = 0;
  if (!player.satThuong) player.satThuong = 10;
  if (!player.phongThu) player.phongThu = 5;
  if (!player.hp) player.hp = 100;
  if (!player.hpHienTai) player.hpHienTai = player.hp || 100;
  if (!player.mp) player.mp = 50;
  if (!player.mpHienTai) player.mpHienTai = player.mp || 50;
  if (!player.kyNang) player.kyNang = ["Quyền Cước"];
  if (!player.phapBao) player.phapBao = [];
  if (!player.nhiemVuHienTai) player.nhiemVuHienTai = null;
  if (!player.lichSu) player.lichSu = [{ thoiGian: Date.now(), suKien: "Bắt đầu tu tiên", tuVi: player.tuVi || 0 }];
  if (!player.lastUpdate) player.lastUpdate = Date.now();

  // Tính chỉ số theo cảnh giới
  let canhGioi = canhGiois.find(c => c.name === player.canhGioi) || canhGiois[0];
  player.satThuong = canhGioi.satThuong + Math.floor(player.theChat / 2);
  player.phongThu = canhGioi.phongThu + Math.floor(player.linhCan / 2);
  player.hp = canhGioi.hp + player.theChat * 10;
  player.mp = canhGioi.mp + player.linhCan * 5;

  if (player.hpHienTai > player.hp) player.hpHienTai = player.hp;
  if (player.mpHienTai > player.mp) player.mpHienTai = player.mp;

  // Cập nhật kỹ năng theo cảnh giới
  let kyNangMoi = kyNangTheoCanhGioi[player.canhGioi] || [];
  kyNangMoi.forEach(kn => {
    if (!player.kyNang.includes(kn)) {
      player.kyNang.push(kn);
    }
  });

  saveData(data);
  return player;
}

function savePlayer(uid, player) {
  let data = loadData();
  data[uid] = player;
  saveData(data);
}

// ===== UPDATE CẢNH GIỚI =====
function updateCanhGioi(player) {
  let old = player.canhGioi;
  for (let i = canhGiois.length - 1; i >= 0; i--) {
    if (player.tuVi >= canhGiois[i].require) {
      player.canhGioi = canhGiois[i].name;
      break;
    }
  }

  if (old !== player.canhGioi) {
    player.lichSu.push({
      thoiGian: Date.now(),
      suKien: `Đột phá lên ${player.canhGioi}`,
      tuVi: player.tuVi
    });
    return true;
  }
  return false;
}

// ===== TẠO NHIỆM VỤ NGẪU NHIÊN =====
function taoNhiemVu(player) {
  let capDo = Math.min(Math.floor(player.tuVi / 5000) + 1, 6);
  let nhiemVuPhuHop = nhiemVuList.filter(nv => nv.capDo <= capDo);
  let nv = nhiemVuPhuHop[Math.floor(Math.random() * nhiemVuPhuHop.length)];

  // Thay thế các biến ngẫu nhiên trong mô tả
  let tenQuai = ["Hắc Long", "Bạch Hổ", "Huyền Vũ", "Chu Tước", "Kỳ Lân", "Cửu Vĩ Hồ", "Kim Sí Điểu"];
  let tenBoiCanh = ["Cổ Mộ", "Bí Cảnh", "Thượng Cổ Di Tích", "Tiên Giới", "Ma Giới", "Động Phủ", "Sơn Động"];
  let tenCaoNhan = ["Lão Tổ", "Tiên Tử", "Đạo Nhân", "Phật Tổ", "Ma Tôn", "Kiếm Thánh", "Đan Vương"];
  let tenThanKhi = ["Thiên Kiếm", "Phục Ma Đao", "Càn Khôn Quyển", "Hỗn Độn Chung", "Bát Quái Lô", "Kim Cang Trác"];
  let vLieu = ["Thiên Thạch", "Long Cốt", "Phượng Hoàng Lông", "Linh Mạch", "Huyền Thiết", "Vạn Niên Huyền Băng"];
  let soLuong = Math.floor(Math.random() * 10) + 1;

  let moTa = nv.moTa
    .replace("{soLuong}", soLuong)
    .replace("{tenQuai}", tenQuai[Math.floor(Math.random() * tenQuai.length)])
    .replace("{tenBoiCanh}", tenBoiCanh[Math.floor(Math.random() * tenBoiCanh.length)])
    .replace("{tenCaoNhan}", tenCaoNhan[Math.floor(Math.random() * tenCaoNhan.length)])
    .replace("{tenThanKhi}", tenThanKhi[Math.floor(Math.random() * tenThanKhi.length)])
    .replace("{vLieu}", vLieu[Math.floor(Math.random() * vLieu.length)]);

  return {
    ...nv,
    moTa: moTa,
    id: Date.now(),
    hoanThanh: false
  };
}

// ===== AUTO CULTIVATE =====
function startAutoCultivate(uid) {
  let autoData = loadAutoData();
  if (!autoData[uid]) {
    autoData[uid] = {
      active: true,
      startTime: Date.now(),
      lastCultivate: Date.now()
    };
    saveAutoData(autoData);
    return true;
  }
  return false;
}

function stopAutoCultivate(uid) {
  let autoData = loadAutoData();
  if (autoData[uid]) {
    delete autoData[uid];
    saveAutoData(autoData);
    return true;
  }
  return false;
}

function processAutoCultivate() {
  let autoData = loadAutoData();
  let playerData = loadData();
  let changed = false;

  for (let uid in autoData) {
    if (!autoData[uid].active) continue;

    let now = Date.now();
    let timePassed = now - autoData[uid].lastCultivate;

    if (timePassed >= 60000) { // 1 phút
      let player = playerData[uid];
      if (player) {
        // Tu luyện tự động
        let gain = 10 + Math.floor(Math.random() * 20);
        if (player.tongMon) {
          let tm = tongMons.find(t => t.name === player.tongMon);
          if (tm) gain = Math.floor(gain * tm.heSoTL);
        }

        player.tuVi += gain;
        player.lastUpdate = now;

        // Random sự kiện khi treo máy
        if (Math.random() < 0.1) { // 10% có sự kiện
          let events = [
            { text: "Phát hiện linh dược, tăng thêm 50 tu vi", tuVi: 50 },
            { text: "Ngộ đạo dưới gốc cây, tăng thêm 100 tu vi", tuVi: 100 },
            { text: "Gặp kỳ ngộ, học được chiêu thức mới", tuVi: 200 },
            { text: "Bị tẩu hỏa nhập ma, mất 50 tu vi", tuVi: -50 },
            { text: "Cứu một người, được tặng 1000 tiền", tien: 1000 }
          ];

          let event = events[Math.floor(Math.random() * events.length)];
          if (event.tuVi) player.tuVi += event.tuVi;
          if (event.tien) player.tien += event.tien;

          player.lichSu.push({
            thoiGian: now,
            suKien: event.text,
            tuVi: player.tuVi
          });
        }

        updateCanhGioi(player);
        changed = true;
      }
      autoData[uid].lastCultivate = now;
    }
  }

  if (changed) {
    saveData(playerData);
    saveAutoData(autoData);
  }
}

// ===== COMMAND =====
module.exports.config = {
  name: "tutien",
  version: "3.0",
  hasPermssion: 0,
  credits: "dtb",
  description: "Game tu tiên hoàn chỉnh",
  commandCategory: "Game",
  usages: "[thamgia|info|tu|auto|nv|tongmon|shop|cheta|san|pvp|rank|top|ls|admin]",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, mentions } = event;
  let player = getPlayer(senderID);

  // Xử lý auto cultivate
  processAutoCultivate();

  // ===== HELP =====
  if (args.length === 0) {
    return api.sendMessage(
      "🌟 𝐓𝐔 𝐓𝐈𝐄̂𝐍 𝐊𝐘̀ 𝐃𝐔𝐘𝐄̂𝐍 🌟\n\n" +
      "📜 𝐃𝐚𝐧𝐡 𝐬𝐚́𝐜𝐡 𝐥𝐞̣̂𝐧𝐡:\n" +
      "1. /tutien thamgia - Bắt đầu hành trình\n" +
      "2. /tutien info - Xem thông tin\n" +
      "3. /tutien tu [số] - Tu luyện\n" +
      "4. /tutien auto [on/off] - Treo máy tự động\n" +
      "5. /tutien nv [nhan/hoanthanh] - Nhiệm vụ\n" +
      "6. /tutien tongmon [số] - Tông môn\n" +
      "7. /tutien shop [mua số] - Mua đan dược\n" +
      "8. /tutien cheta [số] - Chế tạo pháp bảo\n" +
      "9. /tutien san - Săn yêu thú\n" +
      "10. /tutien pvp @tag - Tỷ thí\n" +
      "11. /tutien rank - Bảng xếp hạng\n" +
      "12. /tutien top [tuvi/tien/danhvong] - Top\n" +
      "13. /tutien ls - Lịch sử tu luyện\n" +
      "14. /tutien admin - Quản lý (admin)",
      threadID
    );
  }

  // ===== THAM GIA =====
  if (args[0] === "thamgia") {
    if (player.tuVi > 0) 
      return api.sendMessage("⚠️ Bạn đã tham gia rồi!", threadID);

    player = {
      ten: `Đạo Hữu ${senderID.slice(0,8)}`,
      phe: Math.random() < 0.5 ? "Chính Đạo" : "Ma Đạo",
      tuVi: 0,
      canhGioi: "Phàm Nhân",
      tongMon: null,
      tien: 1000,
      tuoi: 16,
      theChat: Math.floor(Math.random() * 100) + 1,
      linhCan: Math.floor(Math.random() * 100) + 1,
      danhVong: 0,
      satThuong: 10,
      phongThu: 5,
      hp: 100,
      hpHienTai: 100,
      mp: 50,
      mpHienTai: 50,
      kyNang: ["Quyền Cước"],
      phapBao: [],
      nhiemVuHienTai: null,
      lichSu: [{ thoiGian: Date.now(), suKien: "Bắt đầu tu tiên", tuVi: 0 }],
      lastUpdate: Date.now()
    };
    savePlayer(senderID, player);

    return api.sendMessage(
      `✨ 𝐂𝐡𝐮́𝐜 𝐦𝐮̛̀𝐧𝐠 𝐛𝐚̣𝐧 𝐠𝐢𝐚 𝐧𝐡𝐚̣̂𝐩 𝐜𝐨𝐧 đ𝐮̛𝐨̛̀𝐧𝐠 𝐭𝐮 𝐭𝐢𝐞̂𝐧! ✨\n\n` +
      `👤 𝐓𝐞̂𝐧: ${player.ten}\n` +
      `⚖️ 𝐏𝐡𝐞: ${player.phe}\n` +
      `💪 𝐓𝐡𝐞̂̉ 𝐜𝐡𝐚̂́𝐭: ${player.theChat}\n` +
      `🧠 𝐋𝐢𝐧𝐡 𝐜𝐚̆𝐧: ${player.linhCan}\n` +
      `💰 𝐓𝐢𝐞̂̀𝐧 𝐤𝐡𝐨̛̉𝐢 đ𝐚̂̀𝐮: 1000\n\n` +
      `Hãy bắt đầu tu luyện với /tutien tu`,
      threadID
    );
  }

  // ===== INFO =====
  if (args[0] === "info") {
    let canhGioiInfo = canhGiois.find(c => c.name === player.canhGioi) || canhGiois[0];

    return api.sendMessage(
      `📜 𝐓𝐡𝐨̂𝐧𝐠 𝐭𝐢𝐧 𝐧𝐡𝐚̂𝐧 𝐯𝐚̣̂𝐭\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `👤 𝐓𝐞̂𝐧: ${player.ten}\n` +
      `⚖️ 𝐏𝐡𝐞: ${player.phe}\n` +
      `🧘 𝐂𝐚̉𝐧𝐡 𝐠𝐢𝐨̛́𝐢: ${player.canhGioi}\n` +
      `✨ 𝐓𝐮 𝐯𝐢: ${player.tuVi.toLocaleString()}\n` +
      `📊 𝐂𝐚̂́𝐩 đ𝐨̣̂: ${Math.floor(player.tuVi/1000)+1}\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `💪 𝐓𝐡𝐞̂̉ 𝐜𝐡𝐚̂́𝐭: ${player.theChat}\n` +
      `🧠 𝐋𝐢𝐧𝐡 𝐜𝐚̆𝐧: ${player.linhCan}\n` +
      `❤️ 𝐇𝐏: ${player.hpHienTai}/${player.hp}\n` +
      `💙 𝐌𝐏: ${player.mpHienTai}/${player.mp}\n` +
      `⚔️ 𝐒𝐚́𝐭 𝐭𝐡𝐮̛𝐨̛𝐧𝐠: ${player.satThuong}\n` +
      `🛡️ 𝐏𝐡𝐨̀𝐧𝐠 𝐭𝐡𝐮̉: ${player.phongThu}\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `🏯 𝐓𝐨̂𝐧𝐠 𝐦𝐨̂𝐧: ${player.tongMon || "Chưa có"}\n` +
      `💰 𝐓𝐢𝐞̂̀𝐧: ${player.tien.toLocaleString()}\n` +
      `🏆 𝐃𝐚𝐧𝐡 𝐯𝐨̣𝐧𝐠: ${player.danhVong}\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `⚔️ 𝐊𝐲̃ 𝐧𝐚̆𝐧𝐠: ${player.kyNang.join(", ")}`,
      threadID
    );
  }

  // ===== TU LUYỆN =====
  if (args[0] === "tu") {
    let soLan = parseInt(args[1]) || 1;
    if (soLan > 10) soLan = 10;

    let tongGain = 0;
    let messages = [];

    for (let i = 0; i < soLan; i++) {
      let gain = 50 + Math.floor(Math.random() * 100);

      // Hệ số từ tông môn
      if (player.tongMon) {
        let tm = tongMons.find(t => t.name === player.tongMon);
        if (tm) gain = Math.floor(gain * tm.heSoTL);
      }

      // Hệ số từ linh căn
      gain = Math.floor(gain * (1 + player.linhCan / 200));

      player.tuVi += gain;
      tongGain += gain;

      // Có thể học kỹ năng mới
      if (Math.random() < 0.05) {
        let canhGioiKyNang = kyNangTheoCanhGioi[player.canhGioi] || [];
        let kyNangMoi = canhGioiKyNang.find(kn => !player.kyNang.includes(kn));
        if (kyNangMoi) {
          player.kyNang.push(kyNangMoi);
          messages.push(`🌟 Ngộ ra kỹ năng mới: ${kyNangMoi}`);
        }
      }
    }

    let up = updateCanhGioi(player);
    player.hpHienTai = Math.min(player.hp, player.hpHienTai + Math.floor(tongGain/10));
    player.mpHienTai = Math.min(player.mp, player.mpHienTai + Math.floor(tongGain/20));

    savePlayer(senderID, player);

    return api.sendMessage(
      `🧘 𝐓𝐮 𝐥𝐮𝐲𝐞̣̂𝐧 ${soLan} 𝐥𝐚̂̀𝐧\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `✨ 𝐓𝐚̆𝐧𝐠 ${tongGain} 𝐭𝐮 𝐯𝐢\n` +
      (up ? `🌌 𝐃𝐨̂̃𝐢 𝐥𝐞̂𝐧 ${player.canhGioi}!\n` : "") +
      (messages.length > 0 ? messages.join("\n") + "\n" : "") +
      `📊 𝐓𝐮 𝐯𝐢 𝐡𝐢𝐞̣̂𝐧 𝐭𝐚̣𝐢: ${player.tuVi.toLocaleString()}`,
      threadID
    );
  }

  // ===== AUTO CULTIVATE =====
  if (args[0] === "auto") {
    if (args[1] === "on") {
      if (startAutoCultivate(senderID)) {
        return api.sendMessage(
          "⏳ Đã bật chế độ tự động tu luyện!\n" +
          "Cứ mỗi 1 phút bạn sẽ được tăng tu vi.\n" +
          "Dùng 'tutien auto off' để tắt.",
          threadID
        );
      } else {
        return api.sendMessage("⚠️ Bạn đang bật chế độ auto rồi!", threadID);
      }
    } else if (args[1] === "off") {
      if (stopAutoCultivate(senderID)) {
        return api.sendMessage("✅ Đã tắt chế độ tự động tu luyện!", threadID);
      } else {
        return api.sendMessage("⚠️ Bạn chưa bật chế độ auto!", threadID);
      }
    } else {
      return api.sendMessage(
        "📌 Hướng dẫn auto:\n" +
        "- /tutien auto on: Bật tự động tu luyện\n" +
        "- /tutien auto off: Tắt tự động tu luyện",
        threadID
      );
    }
  }

  // ===== NHIỆM VỤ =====
  if (args[0] === "nv") {
    if (args[1] === "nhan") {
      if (player.nhiemVuHienTai && !player.nhiemVuHienTai.hoanThanh) {
        return api.sendMessage("⚠️ Bạn đang có nhiệm vụ chưa hoàn thành!", threadID);
      }

      let nv = taoNhiemVu(player);
      player.nhiemVuHienTai = nv;
      savePlayer(senderID, player);

      return api.sendMessage(
        `📋 𝐍𝐡𝐢𝐞̣̂𝐦 𝐯𝐮̣ 𝐦𝐨̛́𝐢 (𝐂𝐚̂́𝐩 ${nv.capDo})\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `📌 ${nv.ten}\n` +
        `📝 ${nv.moTa}\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `🎁 𝐏𝐡𝐚̂̀𝐧 𝐭𝐡𝐮̛𝐨̛̉𝐧𝐠:\n` +
        `✨ Tu vi: +${nv.thuong.tuVi}\n` +
        `💰 Tiền: +${nv.thuong.tien}\n` +
        `🏆 Danh vọng: +${nv.thuong.danhVong}\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `Dùng 'tutien nv hoanthanh' khi hoàn thành`,
        threadID
      );
    } else if (args[1] === "hoanthanh") {
      if (!player.nhiemVuHienTai) {
        return api.sendMessage("⚠️ Bạn chưa nhận nhiệm vụ!", threadID);
      }

      if (player.nhiemVuHienTai.hoanThanh) {
        return api.sendMessage("⚠️ Nhiệm vụ đã hoàn thành rồi!", threadID);
      }

      // Random tỷ lệ hoàn thành
      let tiLeHoanThanh = Math.random();
      if (tiLeHoanThanh < 0.7) { // 70% hoàn thành
        let nv = player.nhiemVuHienTai;
        player.tuVi += nv.thuong.tuVi;
        player.tien += nv.thuong.tien;
        player.danhVong += nv.thuong.danhVong;
        nv.hoanThanh = true;

        player.lichSu.push({
          thoiGian: Date.now(),
          suKien: `Hoàn thành nhiệm vụ ${nv.ten}`,
          tuVi: player.tuVi
        });

        updateCanhGioi(player);
        savePlayer(senderID, player);

        return api.sendMessage(
          `✅ 𝐇𝐨𝐚̀𝐧 𝐭𝐡𝐚̀𝐧𝐡 𝐧𝐡𝐢𝐞̣̂𝐦 𝐯𝐮̣!\n` +
          `━━━━━━━━━━━━━━━━\n` +
          `🎁 𝐍𝐡𝐚̣̂𝐧 𝐭𝐡𝐮̛𝐨̛̉𝐧𝐠:\n` +
          `✨ +${nv.thuong.tuVi} tu vi\n` +
          `💰 +${nv.thuong.tien} tiền\n` +
          `🏆 +${nv.thuong.danhVong} danh vọng`,
          threadID
        );
      } else {
        return api.sendMessage(
          "❌ Nhiệm vụ thất bại! Hãy thử lại với 'tutien nv nhan'",
          threadID
        );
      }
    } else {
      if (player.nhiemVuHienTai && !player.nhiemVuHienTai.hoanThanh) {
        let nv = player.nhiemVuHienTai;
        return api.sendMessage(
          `📋 𝐍𝐡𝐢𝐞̣̂𝐦 𝐯𝐮̣ 𝐡𝐢𝐞̣̂𝐧 𝐭𝐚̣𝐢\n` +
          `━━━━━━━━━━━━━━━━\n` +
          `📌 ${nv.ten}\n` +
          `📝 ${nv.moTa}\n` +
          `━━━━━━━━━━━━━━━━\n` +
          `Dùng 'tutien nv hoanthanh' để hoàn thành`,
          threadID
        );
      } else {
        return api.sendMessage(
          "📌 Hướng dẫn nhiệm vụ:\n" +
          "- /tutien nv nhan: Nhận nhiệm vụ mới từ AI\n" +
          "- /tutien nv hoanthanh: Hoàn thành nhiệm vụ",
          threadID
        );
      }
    }
  }

  // ===== TÔNG MÔN =====
  if (args[0] === "tongmon") {
    if (!args[1]) {
      let msg = "🏯 𝐃𝐚𝐧𝐡 𝐬𝐚́𝐜𝐡 𝐭𝐨̂𝐧𝐠 𝐦𝐨̂𝐧\n━━━━━━━━━━━━━━━━\n";
      tongMons.forEach((t, i) => {
        msg += `${i+1}. ${t.name}\n`;
        msg += `   📝 ${t.desc}\n`;
        msg += `   ✨ Hệ số: x${t.heSoTL}\n`;
        msg += `   ⚔️ Kỹ năng: ${t.kyNang.join(", ")}\n\n`;
      });
      msg += "Dùng: /tutien tongmon [số] để gia nhập";
      return api.sendMessage(msg, threadID);
    } else {
      let index = parseInt(args[1]) - 1;
      if (index < 0 || index >= tongMons.length) 
        return api.sendMessage("❌ Số không hợp lệ!", threadID);

      if (player.tongMon) {
        return api.sendMessage(`⚠️ Bạn đang ở ${player.tongMon} rồi!`, threadID);
      }

      player.tongMon = tongMons[index].name;
      // Học kỹ năng của tông môn
      tongMons[index].kyNang.forEach(kn => {
        if (!player.kyNang.includes(kn)) {
          player.kyNang.push(kn);
        }
      });

      savePlayer(senderID, player);

      return api.sendMessage(
        `✅ 𝐆𝐢𝐚 𝐧𝐡𝐚̣̂𝐩 ${player.tongMon} 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠!\n` +
        `📝 ${tongMons[index].desc}\n` +
        `✨ Hệ số tu luyện: x${tongMons[index].heSoTL}`,
        threadID
      );
    }
  }

  // ===== SHOP =====
  if (args[0] === "shop") {
    if (args[1] === "mua") {
      let index = parseInt(args[2]) - 1;
      if (index < 0 || index >= danDuoc.length) 
        return api.sendMessage("❌ Số không hợp lệ!", threadID);

      let item = danDuoc[index];
      if (player.tien < item.gia) {
        return api.sendMessage(`❌ Không đủ tiền! Cần ${item.gia}`, threadID);
      }

      player.tien -= item.gia;
      player.tuVi += item.tangTuVi;

      player.lichSu.push({
        thoiGian: Date.now(),
        suKien: `Mua ${item.name}`,
        tuVi: player.tuVi
      });

      updateCanhGioi(player);
      savePlayer(senderID, player);

      return api.sendMessage(
        `✅ Mua ${item.name} thành công!\n` +
        `✨ Tăng ${item.tangTuVi} tu vi\n` +
        `💰 Còn lại: ${player.tien} tiền`,
        threadID
      );
    } else {
      let msg = "🏪 𝐂𝐮̛̉𝐚 𝐡𝐚̀𝐧𝐠 đ𝐚𝐧 𝐝𝐮̛𝐨̛̣𝐜\n━━━━━━━━━━━━━━━━\n";
      danDuoc.forEach((item, i) => {
        msg += `${i+1}. ${item.name}\n`;
        msg += `   💰 Giá: ${item.gia} tiền\n`;
        msg += `   ✨ Tăng: ${item.tangTuVi} tu vi\n\n`;
      });
      msg += "Dùng: /tutien shop mua [số]";
      return api.sendMessage(msg, threadID);
    }
  }

  // ===== CHẾ TẠO PHÁP BẢO =====
  if (args[0] === "cheta") {
    if (args[1] === "tao") {
      let index = parseInt(args[2]) - 1;
      if (index < 0 || index >= phapBao.length) 
        return api.sendMessage("❌ Số không hợp lệ!", threadID);

      let pb = phapBao[index];
      if (player.tien < pb.gia) {
        return api.sendMessage(`❌ Không đủ tiền! Cần ${pb.gia}`, threadID);
      }

      // Kiểm tra cấp độ
      let canhGioiIndex = canhGiois.findIndex(c => c.name === player.canhGioi);
      if (canhGioiIndex + 1 < pb.capDo) {
        return api.sendMessage(`❌ Cảnh giới chưa đủ! Cần cấp ${pb.capDo}`, threadID);
      }

      player.tien -= pb.gia;
      player.phapBao.push({
        ...pb,
        id: Date.now()
      });

      // Tăng chỉ số
      if (pb.satThuong) player.satThuong += pb.satThuong;
      if (pb.phongThu) player.phongThu += pb.phongThu;
      if (pb.hp) player.hp += pb.hp;

      player.lichSu.push({
        thoiGian: Date.now(),
        suKien: `Chế tạo ${pb.name}`,
        tuVi: player.tuVi
      });

      savePlayer(senderID, player);

      return api.sendMessage(
        `✅ 𝐂𝐡𝐞̂́ 𝐭𝐚̣𝐨 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 ${pb.name}!\n` +
        `⚔️ Sát thương: +${pb.satThuong || 0}\n` +
        `🛡️ Phòng thủ: +${pb.phongThu || 0}\n` +
        `❤️ HP: +${pb.hp || 0}`,
        threadID
      );
    } else {
      let msg = "⚒️ 𝐂𝐡𝐞̂́ 𝐭𝐚̣𝐨 𝐩𝐡𝐚́𝐩 𝐛𝐚̉𝐨\n━━━━━━━━━━━━━━━━\n";
      phapBao.forEach((pb, i) => {
        msg += `${i+1}. ${pb.name}\n`;
        msg += `   💰 Giá: ${pb.gia} tiền\n`;
        msg += `   ⚔️ Chỉ số: +${pb.satThuong || 0} dmg, +${pb.phongThu || 0} def, +${pb.hp || 0} hp\n`;
        msg += `   📊 Cấp độ: ${pb.capDo}\n\n`;
      });
      msg += "Dùng: /tutien cheta tao [số]";
      return api.sendMessage(msg, threadID);
    }
  }

  // ===== SĂN BẮT YÊU THÚ =====
  if (args[0] === "san") {
    if (player.hpHienTai <= 0) {
      return api.sendMessage("❌ Bạn đang bị thương! Hãy hồi phục.", threadID);
    }

    let capDo = Math.floor(player.tuVi / 5000) + 1;
    if (capDo > quaiVat.length) capDo = quaiVat.length;
    let quai = quaiVat[capDo - 1];

    // Tái tạo quái vật
    let quaiHp = quai.hp + Math.floor(Math.random() * quai.hp * 0.2);
    let quaiDmg = quai.satThuong + Math.floor(Math.random() * quai.satThuong * 0.2);

    // Chiến đấu
    let damageToQuai = player.satThuong - Math.floor(quaiDmg * 0.2);
    if (damageToQuai < 10) damageToQuai = 10;

    let damageToPlayer = quaiDmg - player.phongThu;
    if (damageToPlayer < 5) damageToPlayer = 5;

    let rounds = Math.ceil(quaiHp / damageToQuai);
    let playerDamage = rounds * damageToPlayer;

    if (playerDamage >= player.hpHienTai) {
      // Thua
      player.hpHienTai = Math.floor(player.hp * 0.1);
      if (player.hpHienTai < 1) player.hpHienTai = 1;
      savePlayer(senderID, player);

      return api.sendMessage(
        `❌ 𝐓𝐡𝐮𝐚 𝐭𝐫𝐨𝐧𝐠 𝐭𝐫𝐚̣̂𝐧 đ𝐚́𝐧𝐡 𝐯𝐨̛́𝐢 ${quai.name}!\n` +
        `❤️ HP còn lại: ${player.hpHienTai}/${player.hp}`,
        threadID
      );
    } else {
      // Thắng
      player.hpHienTai -= playerDamage;
      player.tuVi += quai.tuViThuong;
      player.tien += quai.tienThuong;

      // Random rơi đồ
      if (Math.random() < 0.2) { // 20% rơi đồ
        let pb = phapBao[Math.floor(Math.random() * phapBao.length)];
        player.phapBao.push({...pb, id: Date.now()});
        player.lichSu.push({
          thoiGian: Date.now(),
          suKien: `Nhặt được ${pb.name} từ ${quai.name}`,
          tuVi: player.tuVi
        });
      }

      updateCanhGioi(player);
      savePlayer(senderID, player);

      return api.sendMessage(
        `⚔️ 𝐂𝐡𝐢𝐞̂́𝐧 đ𝐚̂́𝐮 𝐯𝐨̛́𝐢 ${quai.name}\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `✅ 𝐂𝐡𝐢𝐞̂́𝐧 𝐭𝐡𝐚̆́𝐧𝐠!\n` +
        `✨ Nhận ${quai.tuViThuong} tu vi\n` +
        `💰 Nhận ${quai.tienThuong} tiền\n` +
        (Math.random() < 0.2 ? "🎁 Nhặt được pháp bảo!\n" : "") +
        `❤️ HP còn lại: ${player.hpHienTai}/${player.hp}`,
        threadID
      );
    }
  }

  // ===== GIAO ĐẤU =====
  if (args[0] === "pvp") {
    let targetID = Object.keys(mentions)[0];
    if (!targetID) {
      return api.sendMessage("❌ Hãy tag người bạn muốn tỷ thí!", threadID);
    }

    if (targetID === senderID) {
      return api.sendMessage("❌ Không thể tự đánh mình!", threadID);
    }

    let target = getPlayer(targetID);

    if (player.hpHienTai <= 0 || target.hpHienTai <= 0) {
      return api.sendMessage("❌ Một trong hai đang bị thương!", threadID);
    }

    // Tính toán chiến đấu
    let playerPower = player.hp * player.satThuong / 100;
    let targetPower = target.hp * target.satThuong / 100;

    let winner, loser, winnerUID, loserUID;
    if (playerPower > targetPower) {
      winner = player;
      loser = target;
      winnerUID = senderID;
      loserUID = targetID;
    } else {
      winner = target;
      loser = player;
      winnerUID = targetID;
      loserUID = senderID;
    }

    // Tính sát thương
    let damage = Math.floor(Math.random() * 100) + 50;

    // Cập nhật HP
    let loserPlayer = getPlayer(loserUID);
    loserPlayer.hpHienTai -= damage;
    if (loserPlayer.hpHienTai < 0) loserPlayer.hpHienTai = 0;

    // Thưởng cho người thắng
    let winnerPlayer = getPlayer(winnerUID);
    winnerPlayer.tuVi += 100;
    winnerPlayer.tien += 500;

    savePlayer(senderID, player);
    savePlayer(targetID, target);
    savePlayer(winnerUID, winnerPlayer);
    savePlayer(loserUID, loserPlayer);

    return api.sendMessage(
      `⚔️ 𝐓𝐲̉ 𝐭𝐡𝐢́ 𝐠𝐢𝐮̛̃𝐚 ${player.ten} 𝐯𝐚̀ ${target.ten}\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `✅ 𝐍𝐠𝐮̛𝐨̛̀𝐢 𝐭𝐡𝐚̆́𝐧𝐠: ${winnerPlayer.ten}\n` +
      `💔 𝐍𝐠𝐮̛𝐨̛̀𝐢 𝐭𝐡𝐮𝐚: ${loserPlayer.ten}\n` +
      `💥 Sát thương: ${damage}\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `✨ Người thắng nhận 100 tu vi, 500 tiền`,
      threadID
    );
  }

  // ===== XEM PHÁP BẢO =====
  if (args[0] === "pb") {
    if (player.phapBao.length === 0) {
      return api.sendMessage("❌ Bạn chưa có pháp bảo nào!", threadID);
    }

    let msg = "🔮 𝐃𝐚𝐧𝐡 𝐬𝐚́𝐜𝐡 𝐩𝐡𝐚́𝐩 𝐛𝐚̉𝐨\n━━━━━━━━━━━━━━━━\n";
    player.phapBao.forEach((pb, i) => {
      msg += `${i+1}. ${pb.name}\n`;
      if (pb.satThuong) msg += `   ⚔️ DMG: +${pb.satThuong}\n`;
      if (pb.phongThu) msg += `   🛡️ DEF: +${pb.phongThu}\n`;
      if (pb.hp) msg += `   ❤️ HP: +${pb.hp}\n`;
      msg += "\n";
    });

    return api.sendMessage(msg, threadID);
  }

  // ===== BẢNG XẾP HẠNG =====
  if (args[0] === "rank") {
    let data = loadData();
    let sorted = Object.entries(data)
      .sort((a, b) => b[1].tuVi - a[1].tuVi)
      .slice(0, 10);

    let msg = "🏆 𝐁𝐀̉𝐍𝐆 𝐗𝐄̂́𝐏 𝐇𝐀̣𝐍𝐆 𝐓𝐔 𝐓𝐈𝐄̂𝐍\n━━━━━━━━━━━━━━━━\n";
    sorted.forEach(([uid, p], i) => {
      msg += `${i+1}. ${p.ten}\n`;
      msg += `   ✨ Tu vi: ${p.tuVi.toLocaleString()}\n`;
      msg += `   🧘 Cảnh giới: ${p.canhGioi}\n\n`;
    });

    return api.sendMessage(msg, threadID);
  }

  // ===== TOP =====
  if (args[0] === "top") {
    let type = args[1] || "tuvi";
    let data = loadData();

    let sorted;
    if (type === "tuvi") {
      sorted = Object.entries(data).sort((a, b) => b[1].tuVi - a[1].tuVi);
    } else if (type === "tien") {
      sorted = Object.entries(data).sort((a, b) => b[1].tien - a[1].tien);
    } else if (type === "danhvong") {
      sorted = Object.entries(data).sort((a, b) => b[1].danhVong - a[1].danhVong);
    } else {
      return api.sendMessage("❌ Loại không hợp lệ! Dùng: tuvi/tien/danhvong", threadID);
    }

    sorted = sorted.slice(0, 10);

    let msg = `📊 𝐓𝐎𝐏 𝟏𝟎 𝐓𝐇𝐄𝐎 ${type.toUpperCase()}\n━━━━━━━━━━━━━━━━\n`;
    sorted.forEach(([uid, p], i) => {
      msg += `${i+1}. ${p.ten}\n`;
      msg += `   ✨ ${type}: ${p[type].toLocaleString()}\n`;
    });

    return api.sendMessage(msg, threadID);
  }

  // ===== LỊCH SỬ =====
  if (args[0] === "ls") {
    if (player.lichSu.length === 0) {
      return api.sendMessage("❌ Chưa có lịch sử!", threadID);
    }

    let recent = player.lichSu.slice(-10).reverse();
    let msg = "📜 𝐋𝐢̣𝐜𝐡 𝐬𝐮̛̉ 𝐭𝐮 𝐥𝐮𝐲𝐞̣̂𝐧\n━━━━━━━━━━━━━━━━\n";
    recent.forEach((ls, i) => {
      let date = new Date(ls.thoiGian).toLocaleString("vi-VN");
      msg += `${i+1}. ${ls.suKien}\n`;
      msg += `   📅 ${date}\n`;
      msg += `   ✨ Tu vi: ${ls.tuVi.toLocaleString()}\n\n`;
    });

    return api.sendMessage(msg, threadID);
  }

  // ===== ADMIN =====
  if (args[0] === "admin") {
    // Kiểm tra quyền admin - Thay bằng UID admin của bạn
    let admins = ["61588287399958"]; // Thay UID admin của bạn vào đây
    if (!admins.includes(senderID)) {
      return api.sendMessage("❌ Bạn không có quyền admin!", threadID);
    }

    if (args[1] === "list") {
      let data = loadData();
      let msg = "📋 𝐃𝐚𝐧𝐡 𝐬𝐚́𝐜𝐡 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐜𝐡𝐨̛𝐢\n━━━━━━━━━━━━━━━━\n";
      for (let uid in data) {
        msg += `- ${uid}: ${data[uid].ten}\n`;
        msg += `  ✨ Tu vi: ${data[uid].tuVi.toLocaleString()}\n`;
        msg += `  🧘 Cảnh giới: ${data[uid].canhGioi}\n\n`;
      }
      return api.sendMessage(msg, threadID);
    }

    if (args[1] === "set") {
      let uid = args[2];
      let field = args[3];
      let value = args[4];

      if (!uid || !field || !value) {
        return api.sendMessage("❌ Sai cú pháp! Dùng: set [UID] [field] [value]", threadID);
      }

      let target = getPlayer(uid);
      if (!target) {
        return api.sendMessage("❌ Không tìm thấy người chơi!", threadID);
      }

      if (!Object.keys(target).includes(field)) {
        return api.sendMessage("❌ Field không hợp lệ!", threadID);
      }

      target[field] = isNaN(value) ? value : parseInt(value);
      savePlayer(uid, target);

      return api.sendMessage(`✅ Đã sửa ${field} của ${target.ten} thành ${target[field]}`, threadID);
    }

    if (args[1] === "reset") {
      let uid = args[2];
      if (!uid) {
        return api.sendMessage("❌ Cần UID người chơi!", threadID);
      }

      let data = loadData();
      delete data[uid];
      saveData(data);

      return api.sendMessage(`✅ Đã reset người chơi ${uid}`, threadID);
    }

    return api.sendMessage(
      "📌 Admin commands:\n" +
      "- /tutien admin list: Xem danh sách\n" +
      "- /tutien admin set [UID] [field] [value]: Sửa thông tin\n" +
      "- /tutien admin reset [UID]: Reset người chơi",
      threadID
    );
  }

  // ===== DEFAULT =====
  return api.sendMessage(
    "❌ Lệnh không hợp lệ! Dùng /tutien để xem hướng dẫn",
    threadID
  );
};

// ===== AUTO RUN =====
setInterval(processAutoCultivate, 60000); // Chạy mỗi phút