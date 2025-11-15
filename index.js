const express = require("express");
const app = express();

// استخدم fetch مباشرة (متوفر في Node 18+ بدون استيراد)
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

app.use(express.json());

app.post("/send", async (req, res) => {
  try {
    const SERVER_KEY = process.env.FCM_SERVER_KEY;

    if (!SERVER_KEY) {
      return res.status(500).send("❌ Missing FCM_SERVER_KEY on Render");
    }

    const fcmResponse = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "key=" + SERVER_KEY
      },
      body: JSON.stringify(req.body)
    });

    const data = await fcmResponse.text();
    return res.send(data);

  } catch (error) {
    console.error(error);
    return res.status(500).send("FCM Proxy Error");
  }
});

// Render يعطي port تلقائي
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🔥 FCM Proxy running on PORT " + PORT);
});
