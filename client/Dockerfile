# Используем официальный Node.js образ
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем зависимости и устанавливаем их
COPY package*.json ./
RUN npm install

# Copy configuration files
COPY postcss.config.js .
COPY tailwind.config.js .
# Копируем проект
COPY . .

# Сборка приложения
#RUN npm run build
ENV NODE_ENV=development
ENV WATCHPACK_POLLING=true

EXPOSE 3000

# Запуск сервера
CMD ["npm", "start"]