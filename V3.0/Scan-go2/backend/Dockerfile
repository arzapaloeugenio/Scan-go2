# Backend Scan & Go 2 - Node.js 22 LTS (google-auth-library 11.x exige >=22).
FROM node:22.22.3-alpine3.24

ENV NODE_ENV=production
WORKDIR /app

# Copiar primero los manifiestos para aprovechar la caché de capas.
COPY package.json package-lock.json ./

# Instalación reproducible; las dependencias de desarrollo no son necesarias.
RUN npm ci --omit=dev && npm cache clean --force

# Solo el código necesario en tiempo de ejecución.
COPY config ./config
COPY src ./src

# El proceso no necesita privilegios de root.
USER node

EXPOSE 3000

# El punto de entrada real es src/app.js (script "start" de package.json).
CMD ["npm", "start"]
