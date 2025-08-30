FROM mcr.microsoft.com/playwright:v1.55.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY server.js .

EXPOSE 8080

CMD ["npm", "start"]
