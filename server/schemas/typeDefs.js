const { gql } = require( 'apollo-server-express' );

const typeDefs = gql`
    scalar Date

    input CategoryRangeInput {
        order: Int!
        effectiveStartDate: Date!
        effectiveEndDate: Date
        budgetedValue: Float!
    }

    input CategoryInput {
        budgetID: ID!
        title: String!
        budgetedValueRange: [ CategoryRangeInput ]
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

    input UserIDInput {
        _id: ID
    }

    type User {
        _id: ID
        email: String
        budgets: [ID]
    }

    type CategoryRange {
        order: Int!
        effectiveStartDate: Date
        effectiveEndDate: Date
        budgetedValue: Float!
    }

    type Category {
        _id: ID!
        title: String!
        budgetID: ID!
        budgetedValueRange: [ CategoryRange! ]
    }

    type Entry {
        _id: ID!
        title: String!
        value: Float!
        budgetID: ID!
        categoryID: ID!
    }

    type Budget {
        _id: ID!
        ownerIDs: [ID!]
        title: String!
        desc: String!
        categories: [ Category ]
        entries: [ Entry ]
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
        createCategory( input: CategoryInput! ): Budget
        queryBudget( input: BudgetQueryInput! ): Budget
        queryUserBudgets( input: UserIDInput! ): [ Budget ]
    }
    
`;

module.exports = typeDefs;
