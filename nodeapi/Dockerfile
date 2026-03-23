FROM node:18-alpine AS nodeapi-build
WORKDIR /usr/src/app
COPY ./ ./nodeapi/
RUN cd nodeapi && npm ci --omit=dev

FROM node:18-alpine
RUN addgroup -S emartgroup && adduser -S emartuser -G emartgroup

WORKDIR /usr/src/app/
COPY --from=nodeapi-build /usr/src/app/nodeapi/ ./

RUN chown -R emartuser:emartgroup /usr/src/app
USER emartuser

EXPOSE 5000
CMD ["node", "server.js"]

