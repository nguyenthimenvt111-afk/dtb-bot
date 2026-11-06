const rentModule = require("./rent.js");

module.exports.config = {
  name: "key",
  version: "4.0.0",
  hasPermssion: 0,
  hasPermission: 0,
  credits: "dtb",
  description: "Lệnh tắt nhập key và quản lý key thuê bot",
  commandCategory: "Hệ Thống",
  usages: "key <mã_key> / info / create / check",
  cooldowns: 2
};

module.exports.run = async function (options) {
  // Directly reuse rent logic
  return rentModule.run(options);
};
