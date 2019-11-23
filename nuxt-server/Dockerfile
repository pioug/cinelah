FROM node:12-alpine
COPY . .
RUN npm ci
RUN npm run build
ENV PORT 8080
CMD [ "npm", "start" ]
