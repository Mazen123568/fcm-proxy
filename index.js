const express = require("express");
const fetch = require("node-fetch");
const app = express();

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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🔥 FCM Proxy running on PORT " + PORT);
});
