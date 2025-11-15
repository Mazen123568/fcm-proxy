import express from "express";
import fetch from "node-fetch";
import admin from "firebase-admin";
import fs from "fs";

const app = express();
app.use(express.json());

// تحميل ملف الخدمة
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountPath) {
  console.error("❌ Missing GOOGLE_APPLICATION_CREDENTIALS");
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log("🔥 Firebase Admin Loaded");

app.post("/send", async (req, res) => {
  try {
    const response = await admin.messaging().sendMulticast({
      tokens: req.body.registration_ids,
      notification: req.body.notification,
      data: req.body.data
    });

    res.send(response);
  } catch (err) {
    console.error(err);
    res.status(500).send("FCM Error");
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("🔥 FCM Proxy running on PORT " + PORT));
