# The demo's back end (Broker + the demo AI tool) as one container. The pages are static and live elsewhere (web/).
# Build and run:  docker build -t tomoshibi . && docker run -p 8080:8080 --env-file broker/.env.local tomoshibi
FROM node:22-slim
WORKDIR /app
COPY broker/package.json broker/package-lock.json broker/
RUN cd broker && npm ci --omit=dev
COPY broker broker
COPY tools/hosted-start.sh tools/hosted-start.sh
ENV PORT=8080
EXPOSE 8080
CMD ["sh", "tools/hosted-start.sh"]
