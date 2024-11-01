# Stage 1

FROM node:lts-alpine AS build-step

RUN mkdir -p /app

WORKDIR /app

COPY package.json /app

RUN npm install

COPY . /app

ARG CONFIGURATION

RUN npm run build -- --configuration="$CONFIGURATION"


# Stage 2

FROM nginx:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build-step /app/dist/maxim-vms-ui/browser /usr/share/nginx/html
