FROM node:24.20.0-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit
COPY . .
EXPOSE 4173
CMD ["/bin/sh", "-c", "npm run build && npm run preview -- --host"]
