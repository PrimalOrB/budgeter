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
        owner: String!
        emails: [ String ]
        title: String!
        desc: String!
    }

    input BudgetQueryInput {
        user: ID!
        budget: ID!
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
        desc: String!
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
        queryBudget( input: BudgetQueryInput! ): Budget
    }
    
`;

module.exports = typeDefs;
