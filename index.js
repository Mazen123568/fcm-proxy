import express from "express";
import fetch from "node-fetch";
import admin from "firebase-admin";
import fs from "fs";

const app = express();
app.use(express.json());

// تحميل ملف الخدمة من مجلد secrets في Render
const serviceAccount = JSON.parse(
  fs.readFileSync("/etc/secrets/firebase.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// مسار الإرسال
app.post("/send", async (req, res) => {
  try {
    const result = await admin.messaging().send({
      token: req.body.token,
      notification: {
        title: req.body.title,
        body: req.body.body,
        imageUrl: req.body.image
      },
      data: req.body.data || {}
    });

    return res.send({ success: true, id: result });

  } catch (error) {
    console.error("FCM Error:", error);
    return res.status(500).send(error.message);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🔥 FCM Proxy running on PORT ${PORT}`));
