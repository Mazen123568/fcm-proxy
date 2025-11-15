import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

app.post("/send", async (req, res) => {
    try {
        const SERVER_KEY = process.env.FCM_SERVER_KEY;

        const response = await fetch("https://fcm.googleapis.com/fcm/send", {
            method: "POST",
            headers: {
                "Authorization": "key=" + SERVER_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.text();
        res.send(data);
    } catch (error) {
        res.status(500).send("Proxy Error: " + error.toString());
    }
});

app.get("/", (req, res) => {
    res.send("FCM Proxy is running 🔥");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
