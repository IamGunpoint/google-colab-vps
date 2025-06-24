const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Your Devbox URL
const DEVBOX_URL = "https://codesandbox.io/p/devbox/adoring-austin-86gm93";

// Your full cookie string (already shared earlier)
const COOKIE_STRING = "cf_clearance=...; codesandbox-session=BQYsn8...";

// Main fork automation function
async function forkDevbox() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  // Apply cookie
  const cookies = COOKIE_STRING.split(";").map(c => {
    const [name, ...val] = c.trim().split("=");
    return { name, value: val.join("="), domain: ".codesandbox.io" };
  });
  await page.setCookie(...cookies);

  console.log("🔗 Navigating to Devbox workspace...");
  await page.goto(DEVBOX_URL, { waitUntil: "networkidle2" });

  console.log("⏳ Waiting for Fork button...");
  await page.waitForSelector("button:has-text('Fork')", { timeout: 20000 }).catch(() => null);

  const forked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const forkBtn = btns.find(b => b.innerText.toLowerCase().includes("fork"));
    if (forkBtn) {
      forkBtn.click();
      return true;
    }
    return false;
  });

  if (!forked) {
    console.error("❌ Fork button not found");
    await browser.close();
    return "Fork failed";
  }

  console.log("✅ Fork button clicked, waiting...");
  await page.waitForNavigation({ waitUntil: "networkidle2" });

  const newUrl = page.url();
  fs.writeFileSync("latest_fork.json", JSON.stringify({ url: newUrl }, null, 2));
  console.log("✅ Fork complete:", newUrl);

  await browser.close();
  return newUrl;
}

// Web routes
app.get("/", (req, res) => res.send("🟢 Devbox Fork Bot is online."));
app.get("/fork", async (req, res) => {
  const result = await forkDevbox();
  res.send(`<pre>${result}</pre>`);
});
app.get("/latest", (req, res) => {
  if (fs.existsSync("latest_fork.json")) {
    res.send(fs.readFileSync("latest_fork.json", "utf-8"));
  } else {
    res.send("No fork yet.");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 App running on http://localhost:${PORT}`);
});
