const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const COOKIE_STRING = "cf_clearance=...; codesandbox-session=...";
const DEVBOX_URL = "https://codesandbox.io/p/devbox/adoring-austin-86gm93";

function parseCookies(cookieStr) {
  return cookieStr.split(";").map(c => {
    const [name, ...val] = c.trim().split("=");
    return { name, value: val.join("="), domain: ".codesandbox.io" };
  });
}

async function forkDevbox() {
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
  await page.setCookie(...parseCookies(COOKIE_STRING));
  console.log("🌐 Opening Devbox...");
  await page.goto(DEVBOX_URL, { waitUntil: "networkidle2", timeout: 60000 });

  console.log("⏳ Looking for Fork button...");
  await page.waitForSelector("button", { timeout: 20000 });

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
    return "❌ Fork button not found";
  }

  console.log("✅ Forking... waiting for redirect");
  await page.waitForNavigation({ waitUntil: "networkidle2" });

  const url = page.url();
  fs.writeFileSync("latest_fork.json", JSON.stringify({ url }, null, 2));
  await browser.close();
  return `✅ Forked: ${url}`;
}

app.get("/", (req, res) => res.send("🟢 Devbox Fork Bot Running"));
app.get("/fork", async (req, res) => res.send(await forkDevbox()));
app.get("/latest", (req, res) => {
  if (fs.existsSync("latest_fork.json")) res.send(fs.readFileSync("latest_fork.json", "utf-8"));
  else res.send("No fork yet.");
});

app.listen(PORT, () => console.log(`🚀 on http://localhost:${PORT}`));
