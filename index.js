// index.js
const puppeteer = require("puppeteer");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// === 🍪 EMBEDDED GOOGLE COOKIES === //
const cookies = [
  { name: "SAPISID", value: "6mgTcD9LptkHLGwb/AQwBxaz5MhBgVwgXC", domain: ".google.com", path: "/", secure: true },
  { name: "APISID", value: "2082iADWR7Neg5U_/At7GAxV1_JkCEWzSU", domain: ".google.com", path: "/", secure: true },
  { name: "HSID", value: "Auk17c93x4Z1KNG7N", domain: ".google.com", path: "/", secure: true },
  { name: "SSID", value: "AqaUNyCvBef9kgVJE", domain: ".google.com", path: "/", secure: true },
  { name: "SID", value: "g.a000yQ...", domain: ".google.com", path: "/", secure: true },
  { name: "SIDCC", value: "AKEyXzUgX...", domain: ".google.com", path: "/", secure: true },
  { name: "__Secure-1PAPISID", value: "6mgTcD9L...", domain: ".google.com", path: "/", secure: true },
  { name: "__Secure-1PSID", value: "g.a000yQj...", domain: ".google.com", path: "/", secure: true },
  { name: "__Secure-1PSIDCC", value: "AKEyXzXIK...", domain: ".google.com", path: "/", secure: true },
  { name: "__Secure-3PAPISID", value: "6mgTcD9L...", domain: ".google.com", path: "/", secure: true },
  { name: "__Secure-3PSID", value: "g.a000yQj...", domain: ".google.com", path: "/", secure: true },
  { name: "__Secure-3PSIDCC", value: "AKEyXzXL...", domain: ".google.com", path: "/", secure: true }
];

const notebookUrl = "https://colab.research.google.com/drive/1xY2ctDm6KdnW6uNt1vzQVX_YdzBP7O6n#scrollTo=eScOrw202fPf";

let log = "✅ Bot initialized...\n";

async function startColabSession() {
  log += `[${new Date().toISOString()}] 🔁 Launching Puppeteer...\n`;
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setCookie(...cookies);

  try {
    await page.goto(notebookUrl, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForTimeout(10000);

    const startButton = await page.$("colab-connect-button") || await page.$("[id*=connect] button");
    if (startButton) {
      await startButton.click();
      log += `[${new Date().toISOString()}] 🚀 Runtime (re)started.\n`;
    } else {
      log += `[${new Date().toISOString()}] ✅ Runtime already running or button not found.\n`;
    }
  } catch (err) {
    log += `[${new Date().toISOString()}] ❌ Error: ${err.message}\n`;
  } finally {
    await browser.close();
  }
}

// 🔁 Auto check every 5 minutes
setInterval(() => startColabSession(), 5 * 60 * 1000);
startColabSession();

// Fake port for Render + show logs
app.get("/", (_, res) => res.send(`<pre>${log}</pre>`));
app.listen(PORT, () => console.log(`🌐 Web panel: http://localhost:${PORT}`));
