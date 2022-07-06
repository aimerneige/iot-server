// require
const express = require("express");
const mqtt = require("mqtt");
const Redis = require("redis");

// config
const config = require("./config/config.json");
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

// redis client
const redisClient = Redis.createClient();
redisClient.on("error", (err) => {
  console.log("Redis Client Error", err);
  process.exit(1);
});
redisClient.connect();

async function getNextId() {
  const redisKey = MQTT_TOPIC + "/nextid";
  let result = await redisClient.get(redisKey);
  if (result == null) {
    console.log(`Key '${redisKey}' not exist`);
    redisClient.set(redisKey, 1);
    return 1;
  } else {
    let value = parseInt(result);
    value++;
    redisClient.set(redisKey, value);
    return value;
  }
}

async function getDeviceInfo(deviceId) {
  const redisKey = MQTT_TOPIC + "/device"
  let redisData = await redisClient.lRange(redisKey, 0, -1);
  let deviceItems = JSON.parse("[" + redisData + "]");
  deviceItems.forEach((v) => {
    if (v.id == deviceId) {
      return v;
    }
  });
  return null;
}

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
  var messageObj = JSON.parse(message.toString());
  record = {
    time: new Date().toLocaleString("zh-CN"),
    id: messageObj.id,
    data: messageObj.data,
  }
  console.log(record);
  // save to redis
  redisKey = MQTT_TOPIC + "/data";
  redisClient.lPush(redisKey, JSON.stringify(record));
  // trim redis when it is too large
  size = await redisClient.lLen(redisKey);
  if (size > MAX_CACHE_SIZE) {
    redisClient.lTrim(redisKey, 0, MAX_CACHE_SIZE - 1);
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
  let redisKey = MQTT_TOPIC + "/data";
  let redisData = await redisClient.lRange(redisKey, 0, -1);
  let dataObj = JSON.parse("[" + redisData + "]");
  let deviceList = [];
  dataObj.forEach((v) => {
    deviceInfo = getDeviceInfo(v.id);
    if deviceInfo != null {
      deviceList.append({
        time: v.time,
        id: deviceInfo.id,
        type: deviceInfo.type,
        name: deviceInfo.name,
        childType: deviceInfo.childType,
      });
    }
  });
  res.send({
    status: 200,
    message: "success",
    data: deviceList,
  });
});

// add device
app.post("/device", async (req, res) => {
  res.type("application/json");
  let deviceType = req.body.type;
  let deviceName = req.body.name;
  let deviceChildType = req.body.childType;
  if deviceType === undefined || deviceName === undefined || deviceChildType === undefined {
    res.status(400);
    res.send({
      status: 400,
      message: "bad request",
      data: null,
    })
  } else {
    res.status(200);
    redisKey = MQTT_TOPIC + "/device";
    device = {
      id: await getNextId(),
      type: deviceType,
      name: deviceName,
      childType: deviceChildType,
    }
    redisClient.lPush(redisKey, JSON.stringify(device));
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error("Not Found");
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
