// require
const express = require("express");
const mqtt = require("mqtt");
const Redis = require("redis");
// config
const config = require("./config/config.json");

// redis client
const redisClient = Redis.createClient();
redisClient.on("error", (err) => {
  console.log("Redis Client Error", err);
  process.exit(1);
});
redisClient.connect();

// redis config
const MAX_CACHE_SIZE = config.redis.max_cache_size;
// mqtt config
const MQTT_WS_URL = config.mqtt.ws_url;
const MQTT_USERNAME = config.mqtt.username;
const MQTT_PASSWORD = config.mqtt.password;
const MQTT_TOPIC = config.mqtt.topic;
const MQTT_CLIENT_ID = config.mqtt.client_id;
const MQTT_QOS = config.mqtt.qos;
// express config
const EXPRESS_PORT = config.express.port;

// mqtt client
const client = mqtt.connect(MQTT_WS_URL, {
  clientId: MQTT_CLIENT_ID,
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  connectTimeout: 4000,
  keepalive: 60,
  clean: true,
});

client.on("connect", () => {
  console.log("connect success");
  client.subscribe([MQTT_TOPIC], { qos: MQTT_QOS }, (error) => {
    if (error) {
      console.error(`subscribe to '${MQTT_TOPIC}' failed`);
      console.error(error);
      process.exit(1);
    }
    console.log(`subscribe to '${MQTT_TOPIC}' success`);
  });
});

client.on("message", async (topic, message) => {
  console.log(`receive message from topic '${topic}'`);
  message: JSON.parse(message.toString()),
    (record = {
      time: new Date().toLocaleString("zh-CN"),
      id: message.id,
      data: message.data,
    });
  console.log(record);
  // save to redis
  redisClient.lPush(topic, JSON.stringify(record));
  // trim redis when it is too large
  size = await redisClient.lLen(topic);
  if (size > MAX_CACHE_SIZE) {
    redisClient.lTrim(topic, 0, MAX_CACHE_SIZE - 1);
  }
});

client.on("reconnect", (error) => {
  console.log("reconnecting:", error);
});

client.on("error", (error) => {
  console.log("Connect Error:", error);
  process.exit(1);
});

// express app
var app = express();

// set port
app.set("port", EXPRESS_PORT);

// set view engine
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// set index route
app.get("/", (req, res) => {
  res.type("application/json");
  res.status(200);
  res.send({
    status: 200,
    message: "If you see this, the server deploy success!",
    data: null,
  });
});

// data route
app.get("/data", async (req, res) => {
  res.type("application/json");
  res.status(200);
  redisData = await redisClient.lRange(MQTT_TOPIC, 0, -1);
  res.send({
    status: 200,
    message: "success",
    data: JSON.parse("[" + redisData + "]"),
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  res.type("application/json");
  res.status(err.status || 500);
  res.send({
    status: err.status || 500,
    message: err.message,
    data: null,
  });
});

if (require.main === module) {
  app.listen(app.get("port"), function () {
    console.log(
      "Server start in " +
        app.get("env") +
        " mode on http://localhost:" +
        app.get("port") +
        "; press Ctrl + C to terminated."
    );
  });
} else {
  module.exports = app;
}
