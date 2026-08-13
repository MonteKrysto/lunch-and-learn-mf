FROM node:22-alpine
WORKDIR /app
RUN npm install -g pnpm@10
COPY package.json ./
RUN pnpm install
COPY . .
EXPOSE 4100
CMD ["pnpm", "start"]
