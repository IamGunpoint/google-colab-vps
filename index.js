// ✅ Express-based Node.js bot for Render
// ✅ No Puppeteer / No Chrome
// ✅ Includes Colab cookies for simulated header auth
// ✅ Logs shown in browser
// ✅ Auto-restarts Colab notebook on failure

const express = require("express");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ Old cookies you provided earlier (sensitive!)
const COOKIE_STRING = "__Secure-1PAPISID=6mgTcD9LptkHLGwb/AQwBxaz5MhBgVwgXC; __Secure-1PSID=g.a000yQj-iBvMqlEA88m9q4pcbBTGpQ5fmy98Bvxmloov2EW8BaLkM6CvQR5WI6NJkvE35OA8hAACgYKAW8SARYSFQHGX2MiFn1Xf-DAgT2nT6M5_i-BIxoVAUF8yKrY1AAcMjd2NNrcJMicuAbm0076; __Secure-1PSIDCC=AKEyXzXIKrwAHh9PktdGTfXUm-a-ocKjFVjejSSgxATqwDGoxaxg-u2bR93BPQ-0BYEetYG4bhY; __Secure-1PSIDTS=sidts-CjIB5H03P2b1A54yhkgUfGEDDt9PoB8cZXNgk_23zK-4Qf9Z3TixsUoOR2VPPeV9YX0DBRAA; __Secure-3PAPISID=6mgTcD9LptkHLGwb/AQwBxaz5MhBgVwgXC; __Secure-3PSID=g.a000yQj-iBvMqlEA88m9q4pcbBTGpQ5fmy98Bvxmloov2EW8BaLkOxS2noWdpJsH30xCOFZHKgACgYKAW4SARYSFQHGX2MiTdsrvZZZPayvD6qQrb9CrhoVAUF8yKqd0L3by_i6hdSz-9IC3OEc0076; __Secure-3PSIDCC=AKEyXzXLKnRNkR4_0sIiu5shgLBREZFEJIlO0qEhvazrJPI3KRoLPiGDJ436tW86CPm09JWooJnG; __Secure-3PSIDTS=sidts-CjIB5H03P2b1A54yhkgUfGEDDt9PoB8cZXNgk_23zK-4Qf9Z3TixsUoOR2VPPeV9YX0DBRAA; SID=g.a000yQj-iBvMqlEA88m9q4pcbBTGpQ5fmy98Bvxmloov2EW8BaLkPonnOdi7Rp6_ZBszpf5-6AACgYKAUwSARYSFQHGX2MiSB36S8lZ4fll3Qb_BeYnrRoVAUF8yKpRfA-vp1whWEZyBWK6giHI0076; HSID=Auk17c93x4Z1KNG7N; SAPISID=6mgTcD9LptkHLGwb/AQwBxaz5MhBgVwgXC";

// Target Colab notebook
const COLAB_URL = "https://colab.research.google.com/drive/1xY2ctDm6KdnW6uNt1vzQVX_YdzBP7O6n";

let logs = [];
function log(msg) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${msg}`;
  logs.push(entry);
  if (logs.length > 1000) logs.shift();
  console.log(entry);
}

function tryRestartNotebook() {
  log("🔁 Attempting to restart Colab notebook...");

  const req = https.request(
    COLAB_URL + "?forceRestart=1",
    {
      method: "GET",
      headers: {
        "Cookie": COOKIE_STRING,
        "User-Agent": "Mozilla/5.0",
        "Cache-Control": "no-cache"
      }
    },
    (res) => {
      log(`🔁 Restart request status: ${res.statusCode}`);
      if (res.statusCode !== 200) {
        setTimeout(tryRestartNotebook, 10000); // Retry every 10 seconds if restart fails
      }
    }
  );

  req.on("error", (err) => {
    log(`❌ Restart failed: ${err.message}`);
    setTimeout(tryRestartNotebook, 10000); // Retry every 10 seconds if request fails
  });

  req.end();
}

function pingColab() {
  log("📡 Pinging Colab notebook...");

  const req = https.request(
    COLAB_URL,
    {
      method: "GET",
      headers: {
        "Cookie": COOKIE_STRING,
        "User-Agent": "Mozilla/5.0",
        "Cache-Control": "no-cache"
      }
    },
    (res) => {
      log(`✅ Colab responded with status ${res.statusCode}`);
      if (res.statusCode !== 200) {
        tryRestartNotebook();
      }
    }
  );

  req.on("error", (err) => {
    log(`❌ Ping failed: ${err.message}`);
    tryRestartNotebook();
  });

  req.end();
}

// Auto-ping every 5 minutes
setInterval(pingColab, 5 * 60 * 1000);
pingColab();

// Web panel for log view
app.get("/", (_, res) => {
  res.send(
    `<h1>🟢 Colab Bot Running (No Puppeteer)</h1><pre>${logs.slice(-100).join("\n")}</pre>`
  );
});

app.listen(PORT, () => log(`🌐 Bot Web Panel running on port ${PORT}`));
