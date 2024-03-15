FROM node:alpine

WORKDIR /app

COPY ./frontend/package.json ./frontend/yarn.lock /app/

RUN yarn install

COPY ./frontend .

EXPOSE 3000

CMD ["yarn", "start"]
