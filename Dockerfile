FROM node:18-alpine

WORKDIR /app

# Kopijuojame backend package failus
COPY backend/package*.json ./

# Įdiegiame dependencies
RUN npm install

# Kopijuojame visą backend kodą
COPY backend/ .

# Atveriame 3001 portą, kurį naudoja backend
EXPOSE 3001

# Paleidžiame serverį
CMD ["node", "server.js"]
