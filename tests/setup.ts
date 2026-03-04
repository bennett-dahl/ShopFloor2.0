const globalForMongo = globalThis as unknown as {
  mongoServer?: import("mongodb-memory-server").MongoMemoryServer;
  mongoUri?: string;
};

if (process.env.TEST_MONGODB_URI) {
  process.env.MONGODB_URI = process.env.TEST_MONGODB_URI;
} else if (!globalForMongo.mongoUri) {
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const server = new MongoMemoryServer({
    instance: { launchTimeout: 60000 },
  });
  await server.start();
  globalForMongo.mongoServer = server;
  globalForMongo.mongoUri = server.getUri();
  process.env.MONGODB_URI = globalForMongo.mongoUri;
} else {
  process.env.MONGODB_URI = globalForMongo.mongoUri;
}
