import { createApp } from "../dist/app.js";
import { connectDb } from "../dist/db.js";

const app = createApp();

export default async function handler(req, res) {
  await connectDb();
  return app(req, res);
}
