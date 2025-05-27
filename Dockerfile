# Dùng Node.js làm base image
FROM node:23-slim

# Tạo thư mục làm việc trong container
WORKDIR /app

# Copy package.json và package-lock.json (nếu có)
COPY package*.json ./

# Cài đặt thư viện
RUN npm install

# Copy toàn bộ mã nguồn vào container
COPY . .

# Build project NestJS
RUN npm run build

# Mở port 3000 (hoặc port app đang dùng)
EXPOSE 3000

# Chạy ứng dụng
CMD ["node", "dist/main"]
