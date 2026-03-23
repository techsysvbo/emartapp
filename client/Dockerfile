FROM node:18-alpine AS web-build
WORKDIR /usr/src/app
COPY ./ ./client/
RUN cd client && npm ci && npm run build --prod

FROM nginx:1.25-alpine
RUN addgroup -S emartgroup && adduser -S emartuser -G emartgroup

COPY --from=web-build /usr/src/app/client/dist/client/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R emartuser:emartgroup /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html

EXPOSE 4200

