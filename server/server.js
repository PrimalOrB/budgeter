import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { authMiddleware } from "./utils/auth.cjs";
import http from "http";
import cors from "cors";

import db from "./config/connection.cjs";

import path from "path";
import { fileURLToPath } from "url";

import { typeDefs, resolvers } from "./schemas/index.cjs";

const PORT = process.env.PORT || 3001;
const app = express();

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
// const __dirname = path.dirname(__filename); // get the name of the directory

const httpServer = http.createServer(app);
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (err) => {
    if (err.message.startsWith("Database Error: ")) {
      return new Error("Internal server error");
    }
    return err;
  },
  // context: authMiddleware,
});
await server.start();
app.use(
  "/graphql",
  cors(),
  express.urlencoded({ extended: false }),
  express.static("public"),
  express.json(),
  expressMiddleware(server, {
    // context: async ({ req }) => ({ token: req.headers.token }),
    context: async ({ req }) => ({ token: authMiddleware({ req }) }),
  })
);

// app.use(express.static(path.join(__dirname, "../client/build/"))); // the same directory as below

// app.get("*", (req, res) => {
//   res.sendFile(path.resolve(__dirname, "../client/build/", "index.html"));
// });

await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
