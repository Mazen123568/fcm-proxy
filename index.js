
import express from "express";
import admin from "firebase-admin";
import fs from "fs";
import crypto from "crypto";

const app = express();
app.use(express.json({ limit: "1mb" }));

const serviceAccount = JSON.parse(
  fs.readFileSync("/etc/secrets/firebase.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// مقارنة آمنة للمفتاح السري
function isValidSecret(received, expected) {
  if (
    typeof received !== "string" ||
    typeof expected !== "string" ||
    !received ||
    !expected
  ) {
    return false;
  }

  const a = Buffer.from(received);
  const b = Buffer.from(expected);

  return a.length === b.length &&
    crypto.timingSafeEqual(a, b);
}

app.get("/", (req, res) => {
  res.status(200).send("Flicksy FCM Proxy is running");
});

// الإشعارات الحالية: أبقيناها دون تغيير
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
      notification: { title, body },
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

// أمر منفصل للعثور على الهاتف: Data-only
app.post("/send-command", async (req, res) => {
  try {
    const expectedSecret = process.env.FIND_DEVICE_SECRET;
    const receivedSecret = req.get("x-proxy-secret");

    if (!isValidSecret(receivedSecret, expectedSecret)) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED"
      });
    }

    const { token, command } = req.body;

    if (
      typeof token !== "string" ||
      !token.trim() ||
      command !== "FIND_DEVICE"
    ) {
      return res.status(400).json({
        success: false,
        error: "A valid token and FIND_DEVICE command are required"
      });
    }

    const result = await admin.messaging().send({
      token: token.trim(),
      data: {
        command: "FIND_DEVICE"
      },
      android: {
        priority: "high",
        ttl: 0
      }
    });

    return res.status(200).json({
      success: true,
      id: result
    });

  } catch (error) {
    console.error(
      "FCM Command Error:",
      error.code || "",
      error.message || error
    );

    return res.status(500).json({
      success: false,
      error: error.code || "FCM_COMMAND_FAILED"
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Flicksy FCM Proxy running on PORT ${PORT}`);
});
