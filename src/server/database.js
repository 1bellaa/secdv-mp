import { MongoClient } from "mongodb"
import "dotenv/config";
export const db_url = process.env.DB_URL

const client = new MongoClient(db_url)
let connection = await client.connect();
let db = connection.db("prof2pick")
export default db