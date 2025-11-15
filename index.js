const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.use(express.json());

app.post("/send", async (req, res) => {
  try {
    const fcmResponse = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "key=YOUR_SERVER_KEY"
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

// Render automatically sets PORT
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🔥 FCM Proxy running on PORT " + PORT);
});
