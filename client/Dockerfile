# Используем официальный Node.js образ
FROM node:16

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем зависимости и устанавливаем их
COPY package*.json ./
RUN npm install

# Копируем проект
COPY . .

# Сборка приложения
#RUN npm run build

# Запуск сервера
CMD ["npm", "start"]