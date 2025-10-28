import morgan from 'morgan';
import fs from 'fs';
import path from 'path';

// Log format:  [2025-07-11T09:13:14.012Z] 200 GET /api/health 3 ms
const format =
  '[:date[iso]] :status :method :url :response-time ms';

// For serverless environments, only log to console
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

let logger;
if (isServerless) {
  // In serverless, don't write to files (read-only filesystem)
  logger = morgan(format);
} else {
  // In local development, write to file
  const logDir = path.resolve('logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  logger = morgan(format, {
    stream: fs.createWriteStream(path.join(logDir, 'app.log'), { flags: 'a' })
  });
}

export { logger };

// Also print to stdout
export const loggerConsole = morgan(format);
