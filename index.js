const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Replace with your actual cookie string (keep it safe)
const COOKIE_STRING = "cf_clearance=...; codesandbox-session=...";

// Replace with your Devbox ID
const DEVBOX_URL = "https://codesandbox.io/p/devbox/57952w";

// Parse cookie string into puppeteer-friendly format
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
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--no-zygote",
      "--single-process"
    ]
  });

  const page = await browser.newPage();
  await page.setCookie(...parseCookies(COOKIE_STRING));
  console.log("🌐 Navigating to Devbox...");
  await page.goto(DEVBOX_URL, { waitUntil: "networkidle2", timeout: 60000 });

  console.log("⏳ Clicking Fork...");
  const clicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.toLowerCase().includes("fork"));
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

  console.log("⏳ Waiting for redirect...");
  await page.waitForNavigation({ waitUntil: "networkidle2" });

  const forkedUrl = page.url();
  fs.writeFileSync("latest_fork.json", JSON.stringify({ url: forkedUrl }, null, 2));
  await browser.close();
  return `✅ Forked successfully: ${forkedUrl}`;
}

// Web routes
app.get("/", (req, res) => res.send("🟢 Devbox Forker Ready"));
app.get("/fork", async (req, res) => res.send(await forkDevbox()));
app.get("/latest", (req, res) => {
  if (fs.existsSync("latest_fork.json")) res.send(fs.readFileSync("latest_fork.json", "utf-8"));
  else res.send("No fork yet.");
});

app.listen(PORT, () => console.log(`🚀 Listening on port ${PORT}`));
