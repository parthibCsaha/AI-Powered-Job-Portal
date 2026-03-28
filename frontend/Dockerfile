# ── Stage 1: Build ──
FROM node:22-alpine AS build
WORKDIR /app

# Build-time variable for the API URL
ARG VITE_API_URL=/api

# Cache dependencies first
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Runtime ──
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
