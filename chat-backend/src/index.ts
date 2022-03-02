import fastify from "fastify";

const server = fastify({
  logger: true,
});
server.register(import("fastify-websocket"), {
  options: { clientTracking: true },
});

server.register(import("./routes/v1/chat"), { prefix: "/v1/chat" });

server.listen(8080, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  server.log.info(`Server listening at ${address}`);
});
