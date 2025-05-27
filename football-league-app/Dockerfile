FROM node:18-bullseye

RUN apt-get update && apt-get install -y libssl1.1

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
