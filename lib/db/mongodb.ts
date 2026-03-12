import { MongoClient, Db, Collection } from "mongodb";
import { FlightDetails } from "@/lib/types";

let client: MongoClient | null = null;
let db: Db | null = null;

async function getClient(): Promise<MongoClient> {
  if (client) return client;

  const uri = process.env.MONGODB_URI;
  if (!uri || uri === "your_mongodb_atlas_uri_here") {
    throw new Error("MONGODB_URI is not configured");
  }

  client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });

  await client.connect();
  return client;
}

async function getDb(): Promise<Db> {
  if (db) return db;
  const c = await getClient();
  db = c.db("skysafe");
  return db;
}

export async function getFlightCollection(): Promise<Collection> {
  const database = await getDb();
  return database.collection("flights");
}

export async function getMongoFlight(queryKey: string): Promise<FlightDetails | null> {
  try {
    const col = await getFlightCollection();
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
    const uri = process.env.MONGODB_URI;
    if (!uri || uri === "your_mongodb_atlas_uri_here") return false;
    const c = await getClient();
    await c.db("skysafe").command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}
