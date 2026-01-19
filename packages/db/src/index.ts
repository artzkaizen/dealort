import { env } from "@dealort/utils/env";
import { db as nodeDb } from "./client/node";
import { db as serverlessDb } from "./client/serverless";

console.log(env.NODE_ENV);
export const db = env.NODE_ENV === "production" ? serverlessDb : nodeDb;
