FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

FROM grafana/loki:2.9.0 AS loki

FROM caddy:2.8.4 AS caddy
RUN cp /usr/bin/caddy /caddy-sem-cap

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=loki /usr/bin/loki /usr/local/bin/loki
COPY docker/loki-config.yaml /etc/loki/loki-config.yaml
COPY --from=caddy /caddy-sem-cap /usr/local/bin/caddy
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY docker/entrypoint.sh /app/entrypoint.sh
COPY --from=build /app/target/*.jar /app/app.jar
RUN apt-get update && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/* \
    && chmod +x /app/entrypoint.sh && mkdir -p /loki
VOLUME ["/loki"]
ENV JAVA_OPTS="-XX:MaxRAMPercentage=50 -XX:+UseSerialGC -Xss512k"
EXPOSE 8080
ENTRYPOINT ["/usr/bin/tini", "-g", "--", "/app/entrypoint.sh"]
