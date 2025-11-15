import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import fs from "fs";

const app = express();
app.use(bodyParser.json());

// تحميل بيانات service account من ملف secret
const SERVICE_ACCOUNT_PATH = "/etc/secrets/service-account.json";
let SERVICE_ACCOUNT = {};

try {
  SERVICE_ACCOUNT = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH));
} catch (err) {
  console.error("❌ Cannot read Service Account JSON:", err);
}

function getAccessToken() {
  return new Promise((resolve, reject) => {
    const jwt = require("jsonwebtoken");

    const token = jwt.sign(
      {
        iss: SERVICE_ACCOUNT.client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: SERVICE_ACCOUNT.token_uri,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      },
      SERVICE_ACCOUNT.private_key,
      { algorithm: "RS256" }
    );

    fetch(SERVICE_ACCOUNT.token_uri, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`
    })
      .then(res => res.json())
      .then(data => resolve(data.access_token))
      .catch(err => reject(err));
  });
}

app.post("/send", async (req, res) => {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${SERVICE_ACCOUNT.project_id}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: {
            token: req.body.token,
            notification: {
              title: req.body.title,
              body: req.body.body,
              image: req.body.image || null
            },
            data: req.body.data || {}
          }
        })
      }
    );

    const result = await response.text();
    res.send(result);
  } catch (error) {
    console.error("🔥 ERROR:", error);
    res.status(500).send("Error sending FCM v1 notification");
  }
});

// Render port
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("🚀 FCM Proxy V1 running on " + PORT));
