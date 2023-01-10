FROM node:18-slim
COPY package.json package-lock.json ./
RUN ["npm", "install"]
COPY . .
ENTRYPOINT ["npm", "run", "start"]
