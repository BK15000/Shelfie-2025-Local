FROM node:lts

# Set noninteractive environment for apt operations
ENV DEBIAN_FRONTEND=noninteractive

# Set work directory
WORKDIR /app

# Copy the application code
COPY . .

RUN npm install

EXPOSE 8081

CMD [ "npx", "expo", "start", "--web" ]
