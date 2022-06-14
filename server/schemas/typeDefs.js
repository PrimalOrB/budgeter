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
        categoryType: String!
        budgetedValueRange: [ CategoryRangeInput ]
    }

    input CategoryUpdateInput {
        categoryID: ID!
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
    
    input TransactionInput {
        entryID: ID
        title: String!
        value: Float!
        budgetID: ID!
        categoryID: ID!
        createdAt: Date!
        userID: ID!
        individualEntry: Boolean
    }

    input TransferInput {
        value: Float!
        budgetID: ID!
        createdAt: Date!
        userID: ID!
        toUserID: ID!
    }

    input UserIDInput {
        _id: ID!
    }

    input CategoryIDInput {
        _id: ID!
    }

    type User {
        _id: ID
        userInitials: String
        userColor: String
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
        categoryType: String!
        budgetedValueRange: [ CategoryRange! ]
    }

    type Entry {
        _id: ID!
        createdAt: Date!
        title: String!
        value: Float!
        valueType: String!
        budgetID: ID!
        userID: User
        toUserID: User
        categoryID: ID
        individualEntry: Boolean
    }

    type Budget {
        _id: ID!
        ownerIDs: [ User ]
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
        updateCategory( input: CategoryUpdateInput! ): Category
        createTransaction( input: TransactionInput! ): Budget
        editTransaction( input: TransactionInput! ): Budget
        createTransfer( input: TransferInput! ): Budget
        queryBudget( input: BudgetQueryInput! ): Budget
        queryUserBudgets( input: UserIDInput! ): [ Budget ]
        queryCategory( input: CategoryIDInput! ): Category
    }
    
`;

module.exports = typeDefs;
