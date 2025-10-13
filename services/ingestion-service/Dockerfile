FROM node:20-alpine

WORKDIR /app
COPY package*.json ./

RUN npm config set registry http://registry.npmjs.org/ \
 && npm config set fetch-retries 10 \
 && npm config set fetch-retry-factor 3 \
 && npm config set fetch-retry-mintimeout 30000 \
 && npm config set fetch-retry-maxtimeout 180000 \
 && npm install --force --verbose || npm install --force --verbose

COPY . .
EXPOSE 5000
CMD ["npm", "start"]
