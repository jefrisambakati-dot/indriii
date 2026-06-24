# Stage 1: Build menggunakan Maven dan Java 21
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Salin file pom.xml dan unduh dependensi terlebih dahulu agar build cache bisa digunakan
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Salin sisa source code dan lakukan build
COPY . .
RUN mvn clean package -DskipTests

# Stage 2: Jalankan aplikasi Java menggunakan JRE yang lebih ringan
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Buat folder uploads untuk file modul PDF agar siap digunakan
RUN mkdir -p uploads/modules

# Salin file JAR hasil build dari Stage 1
COPY --from=build /app/target/kedipin-1.0.0.jar kedipin.jar

# Ekspos port default Spring Boot (8080)
EXPOSE 8080

# Jalankan aplikasi dengan profil prod dan dukung port dinamis dari Render ($PORT)
ENTRYPOINT ["sh", "-c", "java -jar kedipin.jar --spring.profiles.active=prod --server.port=${PORT:-8080}"]
