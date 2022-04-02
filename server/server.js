const express = require( 'express' );
const { ApolloServer } = require( 'apollo-server-express' );
const db = require( './config/connection' );
const { authMiddleware } = require('./utils/auth');
const path = require('path');

const { typeDefs, resolvers } = require( './schemas' );

require('dotenv').config()

const PORT = process.env.PORT || 3001;
const app = express();
const server = new ApolloServer( {
  typeDefs,
  resolvers,
  formatError: (err) => {
    // Don't give the specific errors to the client.
    if (err.message.startsWith('Database Error: ')) {
      return new Error('Internal server error');
    }

    // Otherwise return the original error. The error can also
    // be manipulated in other ways, as long as it's returned.
    return err;
  },
  context: authMiddleware
} );

server.applyMiddleware( { app } );

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'))
app.use(express.json());


// Serve up static assets
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

db.once('open', () => {
  app.listen(PORT, () => {
    console.log( `API server running on port ${ PORT }!` );
    console.log( `Use GraphQL at http://localhost:${ PORT }${ server.graphqlPath }` );  
  });
});

