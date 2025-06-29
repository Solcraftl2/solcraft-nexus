# Caching e Monitoring API

## Redis Cache
- Il file `api/config/redisClient.js` inizializza un client Redis usando la variabile `REDIS_URL`.
- Gli endpoint più frequenti (lista asset di marketplace e snapshot orderbook) salvano la risposta in cache per ridurre il carico sulle API.
- Le chiavi sono composte dai parametri della richiesta e hanno una TTL di circa 60 secondi per la lista asset e 30 secondi per l'order book.

## Metriche Prometheus
- Tramite `prom-client` vengono raccolte metriche su latenza ed errori.
- Il file `api/config/metrics.js` definisce un `Histogram` per i tempi di risposta e un `Counter` per gli errori.
- Le metriche sono esposte sull'endpoint `/api/metrics` e possono essere raccolte da Prometheus o integrato in Grafana.
