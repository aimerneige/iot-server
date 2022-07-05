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
        "max_cache_size": 144
    },
    "express": {
        "port": 8080
    }
}
```
