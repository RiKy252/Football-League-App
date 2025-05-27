FROM node:18-bullseye

RUN apt-get update && apt-get install -y libssl1.1

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://neondb_owner:npg_gX0oCVz6ZqhH@ep-lively-night-a9fbkz7k-pooler.gwc.azure.neon.tech/neondb?sslmode=require"

EXPOSE 3000

CMD ["npm", "start"]
