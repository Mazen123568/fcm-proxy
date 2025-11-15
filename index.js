import express from "express";
import admin from "firebase-admin";

const app = express();
app.use(express.json());

// تحميل الـ Service Account من Secret Files (Render)
admin.initializeApp({
  credential: admin.credential.cert("/etc/secrets/service-account.json")
});

// إرسال الإشعار
app.post("/send", async (req, res) => {
  try {
    const { token, title, body, image, data } = req.body;

    const message = {
      token: token,
      notification: {
        title: title,
        body: body,
        image: image || null
      },
      data: data || {},
      android: {
        priority: "high"
      }
    };

    const result = await admin.messaging().send(message);
    res.send({ success: true, message_id: result });

  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Proxy Error");
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🔥 Proxy Running on ${PORT}`));
