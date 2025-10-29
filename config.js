// [RAHL-XMD QUANTUM EDITION ⚡]                                      
// >> A superposition of royal power and precision                     
// >> Scripted by Lord Rahl 👑                                          
// >> Version: 9.0.0-quantum.1                                         

const fs = require('fs-extra');
const { Sequelize } = require('sequelize');
const path = require('path');
const crypto = require('crypto');

if (fs.existsSync('config.env'))
require('dotenv').config({ path: __dirname + '/config.env' });

const databasePath = path.join(__dirname, './database.db');
const DATABASE_URL = process.env.DATABASE_URL || databasePath;

// Optional fetch support for restart
let fetch;
try {
  fetch = globalThis.fetch || require('node-fetch');
} catch {
  console.log('⚠️ Fetch not found — fallback restart will be used');
  fetch = null;
}

// ⚙️ HYBRID CONFIG SYSTEM
class HybridConfigManager {
  constructor() {
    this.configDir = path.join(__dirname, 'config');
    this.configFile = path.join(this.configDir, 'settings.json');
    this.backupDir = path.join(this.configDir, 'backups');
    this.sessionId = this.generateSessionId();
    this.cache = new Map();
    this.isHerokuAvailable = false;
    this.herokuClient = null;
    this.appName = null;

    this.initializeStorage();
    this.checkHerokuAvailability(); // safe now ✅
  }

  // ✅ Added missing function
  checkHerokuAvailability() {
    console.log('⚙️ Heroku check skipped — running on Render or local environment.');
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  initializeStorage() {
    try {
      fs.ensureDirSync(this.configDir);
      fs.ensureDirSync(this.backupDir);
      if (!fs.existsSync(this.configFile)) this.createDefaultConfig();
      this.loadConfigToCache();
      console.log('✅ HybridConfig initialized successfully');
    } catch (e) {
      console.error('❌ Failed to initialize hybrid config:', e);
    }
  }

  createDefaultConfig() {
    const defaults = {
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        sessionId: this.sessionId,
      },
      settings: {
        PUBLIC_MODE: process.env.PUBLIC_MODE || 'yes',
        AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || 'yes',
        AUTO_DOWNLOAD_STATUS: process.env.AUTO_DOWNLOAD_STATUS || 'no',
        AUTO_REPLY_STATUS: process.env.AUTO_REPLY_STATUS || 'no',
        AUTO_REACT_STATUS: process.env.AUTO_REACT_STATUS || 'yes',
        CHATBOT: process.env.CHATBOT || 'no',
        AUDIO_CHATBOT: process.env.AUDIO_CHATBOT || 'no',
        WELCOME_MESSAGE: process.env.WELCOME_MESSAGE || 'no',
        GOODBYE_MESSAGE: process.env.GOODBYE_MESSAGE || 'no',
        AUTO_BIO: process.env.AUTO_BIO || 'yes',
        AUTO_REJECT_CALL: process.env.AUTO_REJECT_CALL || 'no',
        GROUP_ANTILINK: process.env.GROUPANTILINK || 'no',
      },
    };
    fs.writeFileSync(this.configFile, JSON.stringify(defaults, null, 2));
  }

  loadConfigToCache() {
    const data = fs.readJsonSync(this.configFile);
    this.cache.clear();
    Object.entries(data.settings).forEach(([k, v]) => this.cache.set(k, v));
    console.log(`✅ Loaded ${this.cache.size} hybrid settings`);
  }

  async saveConfig() {
    const data = fs.readJsonSync(this.configFile);
    data.settings = Object.fromEntries(this.cache);
    data.metadata.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.configFile, JSON.stringify(data, null, 2));
  }

  getSetting(key, def = null) {
    return this.cache.get(key) || def;
  }

  getSessionId() {
    return this.sessionId;
  }
}

const hybridConfig = new HybridConfigManager();

// 🧠 Core Bot Configuration
module.exports = {
  hybridConfig,
  session: process.env.SESSION_ID || '',
  sessionId: hybridConfig.getSessionId(),
  PREFIX: process.env.PREFIX || '.',
  GURL: 'https://whatsapp.com/channel/0029VaZuGSxEawdxZK9CzM0Y',

  OWNER_NAME: process.env.OWNER_NAME || 'LORD RAHL',
  OWNER_NUMBER: process.env.OWNER_NUMBER || '',
  BOT_NAME: process.env.BOT_NAME || 'RAHL_XMD',
  BOT_VERSION: '9.0.0-quantum.1',

  // 👑 UI Config
  MENU_TOP_LEFT: process.env.MENU_TOP_LEFT || "┌─❖",
  MENU_BOT_NAME_LINE: process.env.MENU_BOT_NAME_LINE || "│ ",
  MENU_BOTTOM_LEFT: process.env.MENU_BOTTOM_LEFT || "└┬❖",
  MENU_GREETING_LINE: process.env.MENU_GREETING_LINE || "┌┤ ",
  MENU_DIVIDER: process.env.MENU_DIVIDER || "│└────────┈⳹",
  MENU_USER_LINE: process.env.MENU_USER_LINE || "│🕵️ ",
  MENU_DATE_LINE: process.env.MENU_DATE_LINE || "│📅 ",
  MENU_TIME_LINE: process.env.MENU_TIME_LINE || "│⏰ ",
  MENU_STATS_LINE: process.env.MENU_STATS_LINE || "│⭐ ",
  MENU_BOTTOM_DIVIDER: process.env.MENU_BOTTOM_DIVIDER || "└─────────────┈⳹",

  // 🌌 Core Runtime
  FOOTER: process.env.BOT_FOOTER || '\n\nFor more info visit: rahlverse.online\n\n©2025 RAHL XMD 👑',
  DATABASE_URL,
  DATABASE:
    DATABASE_URL === databasePath
      ? "postgresql://postgres:bKlIqoOUWFIHOAhKxRWQtGfKfhGKgmRX@viaduct.proxy.rlwy.net:47738/railway"
      : DATABASE_URL,

  // ⚡ Feature Toggles (Dynamic)
  get AUTO_READ_STATUS() { return hybridConfig.getSetting('AUTO_READ_STATUS', 'yes'); },
  get AUTO_DOWNLOAD_STATUS() { return hybridConfig.getSetting('AUTO_DOWNLOAD_STATUS', 'no'); },
  get AUTO_REPLY_STATUS() { return hybridConfig.getSetting('AUTO_REPLY_STATUS', 'no'); },
  get AUTO_REACT_STATUS() { return hybridConfig.getSetting('AUTO_REACT_STATUS', 'yes'); },
  get PUBLIC_MODE() { return hybridConfig.getSetting('PUBLIC_MODE', 'yes'); },
  get CHATBOT() { return hybridConfig.getSetting('CHATBOT', 'no'); },
  get AUDIO_CHATBOT() { return hybridConfig.getSetting('AUDIO_CHATBOT', 'no'); },
  get WELCOME_MESSAGE() { return hybridConfig.getSetting('WELCOME_MESSAGE', 'no'); },
  get GOODBYE_MESSAGE() { return hybridConfig.getSetting('GOODBYE_MESSAGE', 'no'); },
  get AUTO_BIO() { return hybridConfig.getSetting('AUTO_BIO', 'yes'); },
  get AUTO_REJECT_CALL() { return hybridConfig.getSetting('AUTO_REJECT_CALL', 'no'); },
  get GROUP_ANTILINK() { return hybridConfig.getSetting('GROUP_ANTILINK', 'no'); },
};

// 🔁 Watch for live updates
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(`♻️ Reloaded ${__filename}`);
  delete require.cache[file];
  require(file);
});
