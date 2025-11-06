//  [RAHL XMD QUANTUM CORE v10.0]  
//  >> A convergence of dark royal intelligence and quantum logic  
//  >> Forged by Lord Rahl  
//  >> Version: 10.0.0-quantum.rahl

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  MiscMessageGenerationOptions,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const axios = require("axios");
const googleIt = require("google-it");
const wikipedia = require("wikipedia");
const playdl = require("play-dl");
const gtts = require("google-tts-api");
const os = require("os");
const { exec } = require("child_process");

const prefix = ".";
const owner = ["254112399557"]; // replace or add more owner numbers (without @c.us)
const VERSION = "10.0.0-quantum.rahl";

// Helper utils
async function bufferFromUrl(url) {
  const res = await axios.get(url, { responseType: "arraybuffer", timeout: 20000 });
  return Buffer.from(res.data);
}

function isOwner(jid) {
  // jid passed like '254112399557@s.whatsapp.net' or normal '254112399557'
  const n = jid.split?.("@")[0] || jid;
  return owner.includes(n);
}

function nowTimestamp() {
  return new Date().toISOString();
}

async function safeSendText(sock, to, text, quoted) {
  try {
    await sock.sendMessage(to, { text }, { quoted });
  } catch (e) {
    console.error("sendText error:", e?.message || e);
  }
}

// START BOT
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./sessions");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: true,
    auth: state,
    browser: ["RAHL XMD", "Chrome", VERSION],
    version,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(chalk.yellow("❌ Connection closed — attempting reconnect..."));
      if (shouldReconnect) startBot();
      else console.log(chalk.red("Logged out — delete sessions and re-scan QR"));
    } else if (connection === "open") {
      console.log(chalk.green("✅ RAHL XMD Quantum Core connected!"));
    }
  });

  // MESSAGE HANDLER
  sock.ev.on("messages.upsert", async (m) => {
    try {
      const msg = m.messages[0];
      if (!msg?.message) return;
      if (msg.key && msg.key.fromMe) return; // ignore self messages if desired

      const from = msg.key.remoteJid;
      const participant = msg.key.participant || from;
      const isGroup = from.endsWith("@g.us");
      const type = Object.keys(msg.message)[0];
      const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
      const quotedMsgKey = msg.message.extendedTextMessage?.contextInfo?.stanzaId
        ? { key: { remoteJid: from, id: msg.message.extendedTextMessage.contextInfo.stanzaId, participant: msg.message.extendedTextMessage?.contextInfo?.participant } }
        : undefined;

      // extract text body
      let body = "";
      if (type === "conversation") body = msg.message.conversation;
      else if (type === "extendedTextMessage") body = msg.message.extendedTextMessage.text;
      else if (type === "imageMessage") body = msg.message.imageMessage?.caption || "";
      else if (type === "videoMessage") body = msg.message.videoMessage?.caption || "";
      else if (type === "documentMessage") body = msg.message.documentMessage?.fileName || "";
      else body = "";

      if (!body.startsWith(prefix)) return;

      const args = body.slice(prefix.length).trim().split(/ +/);
      const cmd = args.shift().toLowerCase();
      const senderId = participant.split("@")[0];

      console.log(chalk.blue(`[${nowTimestamp()}] CMD: ${cmd} from ${senderId} in ${from}`));

      // COMMANDS
      switch (cmd) {
        // ------------------------------
        // Basic / Meta
        // ------------------------------
        case "ping":
          await sock.sendMessage(from, { text: `🏓 Pong!\nLatency: ${Date.now() - (msg.messageTimestamp * 1000)}ms\nVersion: ${VERSION}` }, { quoted: msg });
          break;

        case "alive":
          await sock.sendMessage(from, {
            text: `👑 *RAHL XMD* — Quantum Core\nStatus: ⚡ Online\nOwner: wa.me/${owner[0]}\nPrefix: ${prefix}\nVersion: ${VERSION}\n\nType ${prefix}menu to view commands.`,
          }, { quoted: msg });
          break;

        case "owner":
          await sock.sendMessage(from, { text: `👑 Lord Rahl — wa.me/${owner[0]}` }, { quoted: msg });
          break;

        case "menu":
        case "help":
          await sock.sendMessage(from, {
            text:
`⚜️ *RAHL XMD MENU* ⚜️
Prefix: ${prefix}

— CORE
.ping
.alive
.owner
.menu

— AI
.ai <question>
.gpt <question>
.summon <query>

— SEARCH / INFO
.google <query>
.wiki <query>
.quote
.joke
.fact

— YT & MUSIC
.yt <query>      (search)
.song <query>    (search & info)
.ytmp3 <url>     (download mp3 — may require ffmpeg)
.ytmp4 <url>     (download mp4)

— UTILS
.tts <lang>|<text>
.uptime
.system
.eval <js> (owner only)
.reboot (owner only)

— GROUP (admin)
.kick <@mentions>
.promote <@mentions>
.demote <@mentions>
.groupinfo

— MORE coming soon...
`,
          }, { quoted: msg });
          break;

        // ------------------------------
        // AI & Chat
        // ------------------------------
        case "ai":
        case "gpt":
          if (!args.length) return safeSendText(sock, from, `💬 Provide a prompt.\nExample: ${prefix}ai Who are you?`, msg);
          await safeSendText(sock, from, "🤖 Thinking... please wait", msg);
          {
            const prompt = args.join(" ");
            // Try OpenAI first if key present
            if (process.env.OPENAI_API_KEY) {
              try {
                const OpenAI = require("openai");
                const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
                const resp = await openai.chat.completions.create({
                  model: "gpt-4o-mini",
                  messages: [{ role: "user", content: prompt }],
                  max_tokens: 600,
                });
                const text = resp.choices?.[0]?.message?.content || resp.choices?.[0]?.delta?.content || "⚠️ No response.";
                await safeSendText(sock, from, `🤖 ${text}`, msg);
              } catch (err) {
                console.error("OpenAI error:", err?.message || err);
                // fallback to monkedev public API
                await useMonkeFallback(prompt, sock, from, msg, participant);
              }
            } else {
              // No key -> fallback
              await useMonkeFallback(prompt, sock, from, msg, participant);
            }
          }
          break;

        case "summon":
          if (!args.length) return safeSendText(sock, from, `Usage: ${prefix}summon <short prompt>`, msg);
          try {
            // Use play-dl to search for query and give quick answer (creative alias)
            const q = args.join(" ");
            const res = await playdl.search(q, { limit: 1 });
            if (!res || !res.length) return safeSendText(sock, from, "No results found.");
            const info = res[0];
            await safeSendText(sock, from, `🔎 Found: ${info.title}\nURL: ${info.url}\nType: ${info.type || "video"}`, msg);
          } catch (e) {
            console.error("summon error:", e);
            await safeSendText(sock, from, "❌ Summon failed.");
          }
          break;

        // ------------------------------
        // Search & Info
        // ------------------------------
        case "google":
          if (!args.length) return safeSendText(sock, from, `Usage: ${prefix}google <query>`, msg);
          try {
            const q = args.join(" ");
            const results = await googleIt({ query: q, limit: 5 });
            const out = results.map((r, i) => `${i + 1}. ${r.title}\n${r.link}`).join("\n\n");
            await safeSendText(sock, from, `🔎 Results for "${q}":\n\n${out}`, msg);
          } catch (e) {
            console.error("google error:", e);
            await safeSendText(sock, from, "❌ Search failed.");
          }
          break;

        case "wiki":
          if (!args.length) return safeSendText(sock, from, `Usage: ${prefix}wiki <query>`, msg);
          try {
            const q = args.join(" ");
            const page = await wikipedia.page(q);
            const summary = await page.summary();
            const text = `📚 *${summary.title}*\n\n${summary.extract}\n\nRead more: ${summary.content_urls?.desktop?.page || ""}`;
            await safeSendText(sock, from, text, msg);
          } catch (e) {
            console.error("wiki error:", e);
            await safeSendText(sock, from, "❌ Wiki search failed or page not found.");
          }
          break;

        case "quote":
          try {
            const r = await axios.get("https://api.quotable.io/random");
            const data = r.data;
            await safeSendText(sock, from, `💬 "${data.content}"\n— ${data.author}`, msg);
          } catch (e) {
            console.error("quote error:", e);
            await safeSendText(sock, from, "❌ Could not fetch quote.");
          }
          break;

        case "joke":
          try {
            const r = await axios.get("https://official-joke-api.appspot.com/random_joke");
            const j = r.data;
            await safeSendText(sock, from, `😂 ${j.setup}\n\n${j.punchline}`, msg);
          } catch (e) {
            console.error("joke error:", e);
            await safeSendText(sock, from, "❌ Couldn't fetch a joke.");
          }
          break;

        case "fact":
          try {
            const r = await axios.get("https://uselessfacts.jsph.pl/random.json?language=en");
            const d = r.data;
            await safeSendText(sock, from, `🧠 ${d.text}`, msg);
          } catch (e) {
            console.error("fact error:", e);
            await safeSendText(sock, from, "❌ Couldn't fetch a fact.");
          }
          break;

        // ------------------------------
        // YouTube / Music helpers
        // ------------------------------
        case "yt":
          if (!args.length) return safeSendText(sock, from, `Usage: ${prefix}yt <search query>`, msg);
          try {
            const q = args.join(" ");
            const results = await playdl.search(q, { limit: 5 });
            const out = results.map((r, i) => `${i + 1}. ${r.title}\n${r.url}`).join("\n\n");
            await safeSendText(sock, from, `🔎 YouTube results for "${q}":\n\n${out}`, msg);
          } catch (e) {
            console.error("yt error:", e);
            await safeSendText(sock, from, "❌ YT search failed.");
          }
          break;

        case "song":
          if (!args.length) return safeSendText(sock, from, `Usage: ${prefix}song <query>`, msg);
          try {
            const q = args.join(" ");
            const res = await playdl.search(q, { limit: 1 });
            if (!res || !res.length) return safeSendText(sock, from, "No song found.");
            const s = res[0];
            await safeSendText(sock, from, `🎵 ${s.title}\nDuration: ${s.durationRaw}\nURL: ${s.url}`, msg);
          } catch (e) {
            console.error("song error:", e);
            await safeSendText(sock, from, "❌ Song search failed.");
          }
          break;

        case "ytmp3":
          if (!args.length) return safeSendText(sock, from, `Usage: ${prefix}ytmp3 <yt url>`, msg);
          try {
            const url = args[0];
            await safeSendText(sock, from, "🔊 Preparing audio. This may take a moment...", msg);
            const stream = await playdl.stream(url, { quality: 2 });
            const audioStream = stream.stream; // readable stream
            // Baileys accepts a stream buffer for audio:
            await sock.sendMessage(from, { audio: audioStream, mimetype: "audio/mpeg" }, { quoted: msg });
          } catch (e) {
            console.error("ytmp3 error:", e);
            await safeSendText(sock, from, "❌ Could not fetch audio. Ensure URL is valid and server has ffmpeg.");
          }
          break;

        case "ytmp4":
          if (!args.length) return safeSendText(sock, from, `Usage: ${prefix}ytmp4 <yt url>`, msg);
          try {
            const url = args[0];
            await safeSendText(sock, from, "🎬 Preparing video...", msg);
            const stream = await playdl.stream(url);
            const videoStream = stream.stream;
            await sock.sendMessage(from, { video: videoStream }, { quoted: msg });
          } catch (e) {
            console.error("ytmp4 error:", e);
            await safeSendText(sock, from, "❌ Could not fetch video. Ensure URL is valid and server has ffmpeg.");
          }
          break;

        // ------------------------------
        // TTS
        // ------------------------------
        case "tts":
          // usage: .tts en|Hello there — or .tts en|This is sample
          if (!args.length) return safeSendText(sock, from, `Usage: ${prefix}tts <lang>|<text>\nExample: ${prefix}tts en|I am RAHL`);
          try {
            const raw = body.slice((prefix + "tts").length).trim();
            const parts = raw.split("|");
            const lang = (parts[0] || "en").trim();
            const text = (parts.slice(1).join("|") || "").trim();
            if (!text) return safeSendText(sock, from, "Provide text after the language code and | separator.");
            const url = gtts.getAudioUrl(text, { lang, slow: false, host: "https://translate.google.com" });
            const buff = await bufferFromUrl(url);
            await sock.sendMessage(from, { audio: buff, mimetype: "audio/mpeg" }, { quoted: msg });
          } catch (e) {
            console.error("tts error:", e);
            await safeSendText(sock, from, "❌ TTS failed.");
          }
          break;

        // ------------------------------
        // Utilities
        // ------------------------------
        case "uptime":
          try {
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            await safeSendText(sock, from, `⏱️ Uptime: ${hours}h ${minutes}m ${seconds}s`, msg);
          } catch (e) {
            await safeSendText(sock, from, "Error getting uptime.");
          }
          break;

        case "system":
          try {
            const mem = process.memoryUsage();
            const cpu = os.loadavg();
            const text = `🖥️ System Info\nPlatform: ${os.platform()}\nCPU Load(avg): ${cpu.join(", ")}\nMemory (rss): ${(mem.rss / 1024 / 1024).toFixed(2)} MB`;
            await safeSendText(sock, from, text, msg);
          } catch (e) {
            await safeSendText(sock, from, "❌ Could not retrieve system info.");
          }
          break;

        case "eval":
          if (!isOwner(senderId)) return safeSendText(sock, from, "⛔ Owner-only command.", msg);
          try {
            const code = body.slice((prefix + "eval").length).trim();
            let result = eval(code);
            if (result instanceof Promise) result = await result;
            await safeSendText(sock, from, `✅ Eval result:\n\n${String(result).slice(0, 3000)}`, msg);
          } catch (e) {
            await safeSendText(sock, from, `❌ Eval error:\n${e.message}`, msg);
          }
          break;

        case "reboot":
          if (!isOwner(senderId)) return safeSendText(sock, from, "⛔ Owner-only command.", msg);
          await safeSendText(sock, from, "♻️ Rebooting bot...", msg);
          process.exit(0);
          break;

        // ------------------------------
        // Group Admin Tools (requires bot to be admin)
        // ------------------------------
        case "groupinfo":
          if (!isGroup) return safeSendText(sock, from, "This command works in groups only.", msg);
          try {
            const metadata = await sock.groupMetadata(from);
            const participants = metadata.participants || [];
            const admins = participants.filter((p) => p.admin).map((p) => p.id);
            const text = `👥 Group: ${metadata.subject}\nMembers: ${participants.length}\nAdmins: ${admins.length}\nDesc: ${metadata.desc?.toString() || "No description"}`;
            await safeSendText(sock, from, text, msg);
          } catch (e) {
            console.error("groupinfo error:", e);
            await safeSendText(sock, from, "❌ Could not fetch group info.");
          }
          break;

        case "kick":
        case "remove":
          if (!isGroup) return safeSendText(sock, from, "This is a group-only command.", msg);
          if (!isOwner(senderId)) return safeSendText(sock, from, "⛔ Owner-only for safety.", msg);
          try {
            // expect mentions in extendedTextMessage context
            const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
            if (!mentions.length) return safeSendText(sock, from, `Usage: ${prefix}kick @user`, msg);
            await sock.groupParticipantsUpdate(from, mentions, "remove");
            await safeSendText(sock, from, "✅ Removed mentioned users.", msg);
          } catch (e) {
            console.error("kick error:", e);
            await safeSendText(sock, from, "❌ Could not remove users. Ensure bot is admin.");
          }
          break;

        case "promote":
          if (!isGroup) return safeSendText(sock, from, "This is a group-only command.", msg);
          if (!isOwner(senderId)) return safeSendText(sock, from, "⛔ Owner-only for safety.", msg);
          try {
            const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
            if (!mentions.length) return safeSendText(sock, from, `Usage: ${prefix}promote @user`, msg);
            await sock.groupParticipantsUpdate(from, mentions, "promote");
            await safeSendText(sock, from, "✅ Promoted mentioned users.", msg);
          } catch (e) {
            console.error("promote error:", e);
            await safeSendText(sock, from, "❌ Could not promote users. Ensure bot is admin.");
          }
          break;

        case "demote":
          if (!isGroup) return safeSendText(sock, from, "This is a group-only command.", msg);
          if (!isOwner(senderId)) return safeSendText(sock, from, "⛔ Owner-only for safety.", msg);
          try {
            const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
            if (!mentions.length) return safeSendText(sock, from, `Usage: ${prefix}demote @user`, msg);
            await sock.groupParticipantsUpdate(from, mentions, "demote");
            await safeSendText(sock, from, "✅ Demoted mentioned users.", msg);
          } catch (e) {
            console.error("demote error:", e);
            await safeSendText(sock, from, "❌ Could not demote users. Ensure bot is admin.");
          }
          break;

        // ------------------------------
        // Fallback / unknown
        // ------------------------------
        default:
          await safeSendText(sock, from, `❔ Unknown command: ${cmd}\nType ${prefix}menu to see commands.`, msg);
          break;
      }
    } catch (err) {
      console.error("handler error:", err);
    }
  });

  // helper fallback to monkedev public chat
  async function useMonkeFallback(prompt, sock, to, quotedMsg, participant) {
    try {
      const r = await axios.get(`https://api.monkedev.com/fun/chat?msg=${encodeURIComponent(prompt)}&uid=${participant}`);
      const reply = r.data.response || "⚠️ No response.";
      await safeSendText(sock, to, `🤖 ${reply}`, quotedMsg);
    } catch (e) {
      console.error("monkedev fallback error:", e);
      await safeSendText(sock, to, "❌ All AI services unavailable.");
    }
  }

  return sock;
}

// start
startBot().catch((e) => console.error("Bot crashed:", e));
