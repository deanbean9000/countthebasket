const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
app.use(cors({
  origin: [
    'https://countthebasket.web.app',
    'https://countthebasket-28508.web.app',
    'http://localhost:5173'
  ]
}));
app.use(express.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

app.post("/league-key", async (req, res) => {
  try {
    await client.connect();
    const database = client.db("your_db_name");
    const keys = database.collection("league_keys");

    const result = await keys.findOne({ key: req.body.key });

    if (result) {
      res.status(200).send({ success: true });
    } else {
      res.status(401).send({ error: "Invalid Key" });
    }
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

exports.api = onRequest(app);
