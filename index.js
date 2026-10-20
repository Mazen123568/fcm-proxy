
import express from "express";
import admin from "firebase-admin";
import fs from "fs";

const app = express();
app.use(express.json({ limit: "1mb" }));

const serviceAccount = JSON.parse(
  fs.readFileSync("/etc/secrets/firebase.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.get("/", (req, res) => {
  res.status(200).send("Flicksy FCM Proxy is running");
});

app.post("/send", async (req, res) => {
  try {
    const { token, title, body, image, data = {} } = req.body;

    if (
      typeof token !== "string" || !token.trim() ||
      typeof title !== "string" ||
      typeof body !== "string"
    ) {
      return res.status(400).json({
        success: false,
        error: "token, title and body are required"
      });
    }

    const stringData = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") {
        stringData[key] = value;
      } else if (value != null) {
        stringData[key] = String(value);
      }
    }

    const message = {
      token: token.trim(),
      notification: {
        title,
        body
      },
      data: stringData
    };

    if (typeof image === "string" && image.trim()) {
      message.notification.imageUrl = image.trim();
    }

    const result = await admin.messaging().send(message);

    return res.status(200).json({
      success: true,
      id: result
    });

  } catch (error) {
    console.error("FCM Error:", error.code || "", error.message || error);

    return res.status(500).json({
      success: false,
      error: error.code || "FCM_SEND_FAILED",
      message: error.message || "Failed to send notification"
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Flicksy FCM Proxy running on PORT ${PORT}`);
});
