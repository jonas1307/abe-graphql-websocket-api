FROM node:18
# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 4000 5000
CMD [ "npm", "start"]