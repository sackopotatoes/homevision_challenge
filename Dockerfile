FROM node:16

WORKDIR /usr/src/script

COPY package*.json ./
RUN npm install
COPY . ./
CMD ["npm", "run", "dev"]