# iot server

example config, save it into `src/config/config.json`:

```json
{
    "mqtt": {
        "ws_url": "ws://8970a794.cn-hangzhou.emqx.cloud:8083/mqtt",
        "username": "cb177",
        "password": "5d1edc",
        "topic": "ikp/3ba26185",
        "client_id": "mqtt_b6dcba871d18",
        "qos": 0
    },
    "redis": {
        "max_cache_size": 1000
    },
    "express": {
        "port": 8080
    }
}
```

Return sample:

```json
{
  "status": 200,
  "message": "success",
  "data": [
    {
      "time": "2022/7/6 03:14:10",
      "message": {
        "type": "SENSOR",
        "status": 200,
        "name": "Temperature",
        "message": "success",
        "id": 1950583551,
        "data": { "type": "温度传感器", "data": "36°" }
      }
    },
    {
      "time": "2022/7/6 03:13:55",
      "message": {
        "type": "SENSOR",
        "status": 200,
        "name": "Temperature",
        "message": "success",
        "id": 1950583551,
        "data": { "type": "温度传感器", "data": "36°" }
      }
    },
    {
      "time": "2022/7/6 03:13:50",
      "message": {
        "type": "SENSOR",
        "status": 200,
        "name": "Temperature",
        "message": "success",
        "id": 1950583551,
        "data": { "type": "温度传感器", "data": "36°" }
      }
    },
    {
      "time": "2022/7/6 03:13:35",
      "message": {
        "type": "SENSOR",
        "status": 200,
        "name": "Temperature",
        "message": "success",
        "id": 1950583551,
        "data": { "type": "温度传感器", "data": "36°" }
      }
    },
    {
      "time": "2022/7/6 03:13:30",
      "message": {
        "type": "SENSOR",
        "status": 200,
        "name": "Temperature",
        "message": "success",
        "id": 1950583551,
        "data": { "type": "温度传感器", "data": "36°" }
      }
    }
  ]
}
```
