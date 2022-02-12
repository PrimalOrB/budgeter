const { gql } = require( 'apollo-server-express' );

const typeDefs = gql`
    type User {
        _id: ID
        email: String
    }

    type Auth {
        token: ID!
    }

    type Query {
        _dummy: String
    }

    type Mutation {
        login(email: String! ): Auth
    }
    
`;

module.exports = typeDefs;
