import dotenv from "dotenv";

dotenv.config();

const required = ["MONGODB_URI", "CLIENT_ORIGIN"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  clientOrigin: process.env.CLIENT_ORIGIN,
};
