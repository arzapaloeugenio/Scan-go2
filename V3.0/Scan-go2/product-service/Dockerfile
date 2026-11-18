# Product Service Scan & Go 2 - Node.js 22 LTS (alineado con el backend).
FROM node:22.22.3-alpine3.24

ENV NODE_ENV=production
WORKDIR /app

# Copiar primero los manifiestos para aprovechar la cache de capas.
COPY package.json package-lock.json ./

# Instalacion reproducible; las dependencias de desarrollo no son necesarias.
RUN npm ci --omit=dev && npm cache clean --force

# Solo el codigo necesario en tiempo de ejecucion.
COPY config ./config
COPY src ./src

# El proceso no necesita privilegios de root.
USER node

EXPOSE 3001

# El punto de entrada real es src/app.js (script "start" de package.json).
CMD ["npm", "start"]
