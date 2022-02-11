const { gql } = require( 'apollo-server-express' );

const typeDefs = gql`
    type User {
        email: String
    }

    type Auth {
        token: ID!
        user: User
    }

    type Query {
        _dummy: String
      }

    type Mutation {
        login(email: String! ): Auth
    }
    
`;

module.exports = typeDefs;
