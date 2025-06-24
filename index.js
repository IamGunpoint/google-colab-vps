const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Replace this with your actual working CodeSandbox cookie
const COOKIE_STRING = "cf_clearance=...; codesandbox-session=...";

// Your base Devbox ID
const DEVBOX_URL = "https://codesandbox.io/p/devbox/57952w";

// Helper to parse cookies for Puppeteer
function parseCookies(cookieStr) {
  return cookieStr.split(";").map(c => {
    const [name, ...val] = c.trim().split("=");
    return {
      name,
      value: val.join("="),
      domain: ".codesandbox.io"
    };
  });
}

// Fork function that streams log output
async function forkDevboxWithLogs(log) {
  log("📦 Launching browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--single-process"
    ]
  });

  const page = await browser.newPage();
  log("🍪 Setting cookies...");
  await page.setCookie(...parseCookies(COOKIE_STRING));

  log("🌐 Navigating to Devbox...");
  await page.goto(DEVBOX_URL, { waitUntil: "networkidle2", timeout: 60000 });

  log("🔍 Looking for fork button...");
  const clicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find(b => b.innerText.toLowerCase().includes("fork"));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (!clicked) {
    await browser.close();
    return "❌ Fork button not found.";
  }

  log("✅ Clicked fork. Waiting for new workspace...");
  await page.waitForNavigation({ waitUntil: "networkidle2" });

  const newUrl = page.url();
  log(`🎯 Forked successfully: ${newUrl}`);

  fs.writeFileSync("latest_fork.json", JSON.stringify({ url: newUrl }, null, 2));
  await browser.close();

  return `✅ DONE — Forked to: <a href="${newUrl}" target="_blank">${newUrl}</a>`;
}

// Serve the log-streaming on root `/`
app.get("/", async (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  const log = msg => res.write(`<pre>${msg}</pre>\n`);

  log(`<h2>🧪 Devbox Auto-Fork DEMO</h2>`);
  try {
    const finalMsg = await forkDevboxWithLogs(log);
    log(finalMsg);
    res.end(`<hr><b>✅ Demo complete</b>`);
  } catch (err) {
    log(`❌ ERROR: ${err.message}`);
    res.end(`<hr><b>❌ Failed</b>`);
  }
});

// Show the last forked URL
app.get("/latest", (req, res) => {
  if (fs.existsSync("latest_fork.json")) {
    res.send(fs.readFileSync("latest_fork.json", "utf-8"));
  } else {
    res.send("No forks yet.");
  }
});

app.listen(PORT, () => console.log(`🚀 Running at http://localhost:${PORT}`));
