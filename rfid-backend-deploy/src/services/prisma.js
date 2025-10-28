import pkg from '@prisma/client';
const { PrismaClient } = pkg;

// Create Prisma client with optimized settings for serverless environment
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['warn', 'error'], // Reduced logging for production
  errorFormat: 'minimal',
  // Connection management for serverless
  __internal: {
    engine: {
      connectTimeout: 10000,
    },
  },
});

// Handle graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down Prisma client...');
  await prisma.$disconnect();
};

process.on('beforeExit', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default prisma;