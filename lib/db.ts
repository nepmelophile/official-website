import mongoose from "mongoose";

/*
 * ============================================================================================
 *  WHY THIS FILE CACHES THE CONNECTION (see docs/design.md §5)
 * ============================================================================================
 *  On Vercel every route/server action runs in a serverless function. Many instances can spin
 *  up concurrently and each module may be re-evaluated (and in development, hot-reloaded on
 *  every edit). If we called `mongoose.connect()` on every request we would open a brand-new
 *  connection pool each time and quickly exhaust MongoDB Atlas' connection limit (M0 allows
 *  ~500) — the single most common way a Next.js + MongoDB app falls over in production.
 *
 *  Instead we store the *connection promise* on `globalThis`, which survives module
 *  re-evaluation within a warm function instance (and HMR in dev). Every caller awaits the
 *  same promise, so an instance holds exactly one pool (maxPoolSize below) no matter how many
 *  requests it serves. Always go through `connectToDatabase()` — never call
 *  `mongoose.connect()` directly anywhere else in the app.
 * ============================================================================================
 */

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  /** Timestamp of the last failed connection attempt (used for a short back-off). */
  lastFailureAt: number | null;
}

const globalForMongoose = globalThis as typeof globalThis & {
  __melophileMongoose?: MongooseCache;
};

const cached: MongooseCache = (globalForMongoose.__melophileMongoose ??= {
  conn: null,
  promise: null,
  lastFailureAt: null,
});

/**
 * After a failed connection we fail fast for this long instead of waiting for another
 * server-selection timeout. Keeps builds/pages snappy when the DB is unreachable.
 */
const FAILURE_BACKOFF_MS = 15_000;

/** Thrown while in the post-failure back-off window (no network attempt was made). */
export class DbUnavailableError extends Error {
  constructor() {
    super("MongoDB connection recently failed; skipping retry during back-off window.");
    this.name = "DbUnavailableError";
  }
}

/** True when a MongoDB connection string is configured. */
export function isDbConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI?.trim());
}

/**
 * Returns the shared Mongoose instance, connecting on first use.
 * Throws a descriptive error when MONGODB_URI is missing or the database is unreachable.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (see .env.example) or your Vercel project settings.",
    );
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    if (cached.lastFailureAt && Date.now() - cached.lastFailureAt < FAILURE_BACKOFF_MS) {
      throw new DbUnavailableError();
    }

    mongoose.set("strictQuery", true);

    cached.promise = mongoose
      .connect(uri, {
        // Fail fast instead of queueing model calls while disconnected.
        bufferCommands: false,
        serverSelectionTimeoutMS: 5_000,
        // One modest pool per warm serverless instance.
        maxPoolSize: 10,
        minPoolSize: 0,
        maxIdleTimeMS: 60_000,
      })
      .then((instance) => {
        cached.lastFailureAt = null;
        return instance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset so the next call (after back-off) can retry with a fresh attempt.
    cached.promise = null;
    cached.conn = null;
    cached.lastFailureAt = Date.now();
    throw error;
  }

  return cached.conn;
}

/** Alias kept for readability in scripts. */
export const dbConnect = connectToDatabase;

/** Closes the shared connection (used by scripts such as the seeder). */
export async function disconnectFromDatabase(): Promise<void> {
  if (cached.conn) {
    await cached.conn.disconnect();
  }
  cached.conn = null;
  cached.promise = null;
}
