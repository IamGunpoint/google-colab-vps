const axios = require("axios");
const fs = require("fs");

const SESSION_COOKIE = "codesandbox-session=BQYsn8q10n91Gtydf1WfA3lkhx6e8JEXWNWbq3TASe8-1750774919761-0.0.1.1-604800000";
const START_ID = "86gm93";

const HEADERS = {
  "User-Agent": "Mozilla/5.0",
  "Cookie": SESSION_COOKIE,
};

async function testForkOnce() {
  console.log("⏳ Waiting 1 second...");
  await new Promise((r) => setTimeout(r, 1000));

  console.log(`🔁 Forking sandbox ID: ${START_ID}`);
  try {
    const res = await axios.post(
      `https://codesandbox.io/api/v1/sandboxes/${START_ID}/fork`,
      {},
      { headers: HEADERS }
    );

    const newId = res.data.data.id;
    const newUrl = `https://codesandbox.io/s/${newId}`;
    console.log(`✅ Forked successfully to: ${newUrl}`);

    // Optional: Save it to a file
    fs.writeFileSync("demo-fork.json", JSON.stringify({ id: newId, url: newUrl }, null, 2));
    console.log(`💾 Saved to demo-fork.json`);

  } catch (err) {
    console.error("❌ Forking failed:", err.response?.data || err.message);
  }
}

testForkOnce();
