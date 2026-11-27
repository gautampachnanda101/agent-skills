// Reads configuration from the environment.
export const config = {
  databaseUrl: process.env.ORDERS_DB_URL,
  port: Number(process.env.PORT ?? 3000),
};
