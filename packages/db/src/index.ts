import { env } from "@dealort/utils/env";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as authSchema from "./schema/auth";
import * as orgMetaSchema from "./schema/org_meta";
import * as reviewsSchema from "./schema/reviews";
import * as waitlistSchema from "./schema/waitlist";

const schema = {
  ...authSchema,
  ...orgMetaSchema,
  ...reviewsSchema,
  ...waitlistSchema,
};

const client = createClient({
  url: env.DATABASE_URL || "",
});

export const db = drizzle({ client, schema });
