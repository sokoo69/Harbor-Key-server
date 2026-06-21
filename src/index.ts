import { app } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

async function bootstrap() {
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`API running on ${env.port}`);
  });
}

bootstrap().catch((error: unknown) => {
  console.error("Server bootstrap failed:", error);
  process.exit(1);
});
