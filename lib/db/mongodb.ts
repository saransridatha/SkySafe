import { MongoClient, Db, Collection } from "mongodb";
import { FlightDetails } from "@/lib/types";
import fs from "fs";
import path from "path";

let client: MongoClient | null = null;
let db: Db | null = null;

async function getClient(): Promise<MongoClient> {
  if (client) return client;

  const uri = process.env.MONGODB_URI;
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

  if (!uri || uri === "your_mongodb_atlas_uri_here") {
    if (isBuildPhase) {
      console.warn("MONGODB_URI is not available during build phase.");
      return null as any;
    }
    console.error("MONGODB_URI check failed.");
    throw new Error("MONGODB_URI is not configured");
  }

  // Strip quotes
  const cleanUri = uri.startsWith('"') && uri.endsWith('"') ? uri.slice(1, -1) : uri;

  // AWS DocumentDB uses strict TLS with a custom CA bundle
  const isDocDB = cleanUri.includes('docdb.amazonaws.com');
  const tlsOptions: any = {};

  if (isDocDB) {
    // Attempt to load the global AWS RDS/DocDB cert bundle
    const certPath = path.join(process.cwd(), 'global-bundle.pem');
    if (fs.existsSync(certPath)) {
      tlsOptions.tls = true;
      tlsOptions.tlsCAFile = certPath;
      tlsOptions.retryWrites = false; // DocDB doesn't fully support retryable writes
    }
  }

  client = new MongoClient(cleanUri, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    ...tlsOptions
  });

  await client.connect();
  return client;
}

async function getDb(): Promise<Db | null> {
  if (db) return db;
  const c = await getClient();
  if (!c) return null;
  db = c.db("skysafe");
  return db;
}

export async function getFlightCollection(): Promise<Collection | null> {
  const database = await getDb();
  if (!database) return null;
  return database.collection("flights");
}

export async function getMongoFlight(queryKey: string): Promise<FlightDetails | null> {
  try {
    const col = await getFlightCollection();
    if (!col) return null;
    const doc = await col.findOne({ queryKey });
    if (!doc) return null;

    return {
      flightNumber: doc.flightNumber,
      airline: doc.airline,
      airlineName: doc.airlineName,
      aircraftType: doc.aircraftType,
      origin: doc.origin,
      destination: doc.destination,
      departureTime: doc.departureTime,
      arrivalTime: doc.arrivalTime,
      waypoints: doc.waypoints,
      countries: doc.countries,
    };
  } catch (error) {
    console.error("MongoDB read error:", error);
    return null;
  }
}

export async function setMongoFlight(queryKey: string, flight: FlightDetails): Promise<void> {
  try {
    const col = await getFlightCollection();
    if (!col) return;
    await col.updateOne(
      { queryKey },
      {
        $set: {
          queryKey,
          ...flight,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error("MongoDB write error:", error);
  }
}

export async function ensureIndexes(): Promise<void> {
  try {
    const col = await getFlightCollection();
    if (!col) return;
    await col.createIndex({ queryKey: 1 }, { unique: true });
    await col.createIndex({ flightNumber: 1 });
    await col.createIndex({ origin: 1, destination: 1 });
    await col.createIndex({ updatedAt: 1 });
  } catch (error) {
    console.error("MongoDB index creation error:", error);
  }
}

// Check if MongoDB is available
export async function isMongoAvailable(): Promise<boolean> {
  try {
    const c = await getClient();
    if (!c) return false;
    await c.db("skysafe").command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}
