import "dotenv/config";
import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { unwrapResolverError } from "@apollo/server/errors";
import { GraphQLError } from "graphql";
import { getUserFromRequest } from "./utils/auth.cjs";
import http from "http";
import cors from "cors";

import db from "./config/connection.cjs";

import path from "path";
import { fileURLToPath } from "url";

import { typeDefs, resolvers } from "./schemas/index.cjs";

const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === "production";
const app = express();

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const httpServer = http.createServer(app);
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: !isProduction,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  formatError: (formattedError, error) => {
    // expected errors (auth, validation) are thrown as GraphQLErrors;
    // anything else is unexpected - log it and hide the details
    const original = unwrapResolverError(error);
    if (original instanceof GraphQLError || formattedError.extensions?.code !== "INTERNAL_SERVER_ERROR") {
      return formattedError;
    }
    console.error(original);
    return {
      message: "Internal server error",
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    };
  },
});
await server.start();
app.use(
  "/graphql",
  cors(),
  express.json({ limit: "1mb" }),
  expressMiddleware(server, {
    context: async ({ req }) => ({ user: getUserFromRequest(req) }),
  })
);

if (isProduction) {
  app.use(express.static(path.join(__dirname, "../client/dist")));
}

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/dist/", "index.html"));
});

db.on("error", (err) => console.error("MongoDB connection error:", err));

await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
