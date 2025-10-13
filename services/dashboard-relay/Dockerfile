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
RUN mkdir -p /app/uploads /app/logs
ENV PORT=5010
ENV NODE_ENV=production
ENV MONGO_URI=mongodb://mongo:27017/podcastdb
EXPOSE 5010
CMD ["npm", "start"]
