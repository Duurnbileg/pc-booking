import mongoose from "mongoose";
import { env } from "./config/env.js";

let memoryUri: string | null = null;

export async function connectDb(): Promise<typeof mongoose> {
  mongoose.set("strictQuery", true);

  let uri = env.mongodbUri;
  if (env.useMemoryDb || uri === "memory") {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const mongod = await MongoMemoryServer.create();
    memoryUri = mongod.getUri("pc-booking");
    uri = memoryUri;
    console.log("Using in-memory MongoDB");
  }

  return mongoose.connect(uri);
}

export function getDbUri(): string {
  return memoryUri ?? env.mongodbUri;
}
