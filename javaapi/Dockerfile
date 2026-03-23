FROM eclipse-temurin:17-jdk-alpine AS BUILD_IMAGE
WORKDIR /usr/src/app/
RUN apk add --no-cache maven
COPY ./ /usr/src/app/
RUN mvn install -DskipTests

FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S emartgroup && adduser -S emartuser -G emartgroup

WORKDIR /usr/src/app/
COPY --from=BUILD_IMAGE /usr/src/app/target/book-work-0.0.1-SNAPSHOT.jar ./book-work-0.0.1.jar

RUN chown emartuser:emartgroup /usr/src/app/book-work-0.0.1.jar
USER emartuser

EXPOSE 9000
ENTRYPOINT ["java", "-jar", "book-work-0.0.1.jar"]

