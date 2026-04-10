import { MongoClient } from "mongodb";
import "dotenv/config";

export const db_url = process.env.DB_URL;
const client = new MongoClient(db_url);

let db;

export const connectToDatabase = async () => {
  if (db) return db; // Return existing connection
  try {
    const connection = await client.connect();
    db = connection.db("cssecdv");
    console.log("Successfully connected to MongoDB");
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    throw error;
  }
};

// Export a default object that gets the db
export default db;