# Etapa 1: compilar el jar
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q package -DskipTests

# Etapa 2: imagen final solo con el jar y el JRE
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --no-create-home aquachile \
    && mkdir /app/almacen \
    && chown aquachile /app/almacen
COPY --from=build /app/target/*.jar app.jar
USER aquachile
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
