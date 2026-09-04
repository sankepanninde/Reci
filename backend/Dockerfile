FROM node:20-bullseye-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 4000

CMD ["sh", "-c", "node src/seedUser.js && node src/index.js"]