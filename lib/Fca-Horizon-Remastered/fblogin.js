// File: fblogin.js

module.exports = function (globalFca) {
  const axios = require('axios');
  const crypto = require('crypto');
  const { v4: uuidv4 } = require('uuid');
  const qs = require('qs');
  const speakeasy = require('speakeasy');
  const fs = require('fs');
  const path = require('path');

  const Database = require(globalFca.Require.paths.Database);
  const logger = globalFca.Require.logger;
  const Language = globalFca.Require.Language;

  class FacebookLogin {
    static async login() {
      const email = Database().get("Account");
      const password = Database().get("Password");
      const twoFactorSecret = Database().get("TwoFAKey") || "0";

      if (!email || !password) {
        logger.Warning("⚠️ Không tìm thấy email hoặc mật khẩu trong Database");
        return { status: false, message: 'Missing account credentials' };
      }

      logger.Normal("🔄 Bắt đầu đăng nhập Facebook...");

      const adid = uuidv4();
      const device_id = uuidv4();
      const family_device_id = uuidv4();
      const machine_id = [...Array(24)].map(() =>
        'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
      ).join('');

      let loginData = {
        adid,
        email,
        password,
        device_id,
        family_device_id,
        locale: 'en_US',
        credentials_type: 'password',
        generate_session_cookies: '1',
        source: 'login',
        machine_id,
        fb_api_caller_class: 'com.facebook.account.login.protocol.Fb4aAuthHandler',
        api_key: '882a8490361da98702bf97a021ddc14d',
        access_token: '350685531728|62f8ce9f74b12f84c123cc23437a4a32'
      };

      const sig = Object.entries(Object.fromEntries(Object.entries(loginData).sort()))
        .map(([k, v]) => `${k}=${v}`).join('');
      loginData.sig = crypto.createHash('md5').update(sig + loginData.access_token).digest('hex');

      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 12; SM-G988N Build/SP1A.210812.016; com.termux)',
        'x-fb-http-engine': 'Liger',
        'x-fb-friendly-name': 'authenticate'
      };

      try {
        logger.Normal("📬 Gửi yêu cầu đăng nhập lần đầu...");
        const res = await axios.post('https://b-graph.facebook.com/auth/login', qs.stringify(loginData), { headers });

        const cookies = res.data.session_cookies.map(c => `${c.name}=${c.value}`).join('; ');
        const appState = this.formatCookiesToAppState(cookies);

        fs.writeFileSync(path.join(__dirname, '../../../appstate.json'), JSON.stringify(appState, null, 2));
        logger.Success("✅ Đăng nhập thành công, appState đã lưu vào appstate.json");

        return { status: true, cookies, appState };

      } catch (err) {
        const errorData = err.response?.data?.error?.error_data;

        if (!errorData || twoFactorSecret === '0') {
          logger.Error("❌ Cần mã 2FA hoặc tài khoản sai.");
          return { status: false, message: '2FA code needed or invalid credentials.' };
        }

        const totpCode = speakeasy.totp({
          secret: twoFactorSecret.replace(/\s+/g, '').toUpperCase(),
          encoding: 'base32'
        });

        logger.Normal("📬 Gửi lại yêu cầu đăng nhập với mã 2FA...");

        const twoFactorData = {
          ...loginData,
          credentials_type: 'two_factor',
          twofactor_code: totpCode,
          userid: errorData.uid,
          machine_id: errorData.machine_id,
          first_factor: errorData.login_first_factor
        };

        const sig2 = Object.entries(Object.fromEntries(Object.entries(twoFactorData).sort()))
          .map(([k, v]) => `${k}=${v}`).join('');
        twoFactorData.sig = crypto.createHash('md5').update(sig2 + loginData.access_token).digest('hex');

        try {
          const twoFARes = await axios.post('https://b-graph.facebook.com/auth/login', qs.stringify(twoFactorData), { headers });
          const cookies = twoFARes.data.session_cookies.map(c => `${c.name}=${c.value}`).join('; ');
          const appState = this.formatCookiesToAppState(cookies);

          fs.writeFileSync(path.join(__dirname, 'lib/appstate.json'), JSON.stringify(appState, null, 2));
          logger.Success("✅ Đăng nhập với 2FA thành công, appState đã lưu vào appstate.json");


          return { status: true, cookies, appState };

        } catch (err2) {
          logger.Error("❌ Đăng nhập với 2FA thất bại.");
          return { status: false, message: 'Failed to log in with 2FA.' };
        }
      }
    }

    static formatCookiesToAppState(cookieString) {
      return cookieString.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        return value ? [...acc, { key, value, domain: 'facebook.com', path: '/' }] : acc;
      }, []);
    }
  }

  return FacebookLogin;
}
