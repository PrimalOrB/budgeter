const { gql } = require( 'apollo-server-express' );

const typeDefs = gql`
    scalar Date

    input BudgetCategoryInput {
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

    input UserIDInput {
        _id: ID
    }

    type User {
        _id: ID
        email: String
        budgets: [ID]
    }

    type Category {
        _id: ID!
        title: String!
        effectiveStartDate: Date
        effectiveEndDate: Date
        budgetedValue: Float!
        budgetID: ID!
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
        queryBudget( input: BudgetQueryInput! ): Budget
        queryUserBudgets( input: UserIDInput! ): [ Budget ]
    }
    
`;

module.exports = typeDefs;
