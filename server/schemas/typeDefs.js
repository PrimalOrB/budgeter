const { gql } = require( 'apollo-server-express' );

const typeDefs = gql`
    scalar Date

    input BudgetLineInput {
        title: String!
        effectiveStartDate: Date
        effectiveEndDate: Date
        budgetedValue: Float!
    }

    input BudgetInput {
        ownerIDs: [ID!],
        title: String!,
        lines: [ BudgetLineInput! ]
    }

    type User {
        _id: ID
        email: String
        budgets: [ID]
    }

    type BudgetLine {
        title: String!
        effectiveStartDate: Date
        effectiveEndDate: Date
        budgetedValue: Float!
    }

    type Budget {
        _id: ID
        ownerIDs: [ID!]
        title: String!
        lines: [ BudgetLine ]
    }

    type Auth {
        token: ID!
    }

    type Query {
        _dummy: String
    }

    type Mutation {
        login(email: String! ): Auth
        createBudget( input: BudgetInput! ): Budget
    }
    
`;

module.exports = typeDefs;
