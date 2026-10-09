import type { NextConfig } from "next";
const config: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  // Seed files are read at runtime by the database seeder.
  outputFileTracingIncludes: { "/**": ["./data/**", "./evals/**"] },
};
export default config;
