const { default: axios } = require("axios");
const express = require("express");
const cors = require("cors");
const Redis = require("redis");

const redisClient = Redis.createClient();
// const redisClient = Redis.createClient({url: "http://"}); // for production, you will be adding your own url

const DEFAULT_EXPIRATION = 3600;

const app = express();
app.use(cors());

app.get("/photos", async (req, res) => {
  // console.log("ok");
  const albumId = req.query.albumId;

  const photos = await getOrSetCache(`photos?albumId=${albumId}`, async () => {
    const { data } = await axios.get(
      "https://jsonplaceholder.typicode.com/photos",
      {
        params: { albumId },
      }
    );
    return data;
  });
  res.json(photos);
});

app.get("/photos/:id", async (req, res) => {
  const photo = await getOrSetCache(`photos:${req.params.id}`, async () => {
    const { data } = await axios.get(
      `https://jsonplaceholder.typicode.com/photos/${req.params.id}`
    );
    return data;
  });

  res.send(photo);
});

function getOrSetCache(key, cb) {
  return new Promise((resolve, reject) => {
    redisClient.get(key, async (error, data) => {
      if (error) return reject(error);
      if (data != null) {
        console.log("Cache hit");
        return resolve(JSON.parse(data));
      }
      const freshData = await cb();
      console.log("Cache miss");
      redisClient.setex(key, DEFAULT_EXPIRATION, JSON.stringify(freshData));
      resolve(freshData);
    });
  });
}

app.listen(3000, (err) => {
  if (err) console.log(error);
});
