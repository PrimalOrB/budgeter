const typeDefs = `
    scalar Date

    input CategoryInput {
        budgetID: ID!
        title: String!
        categoryType: String!
    }

    input CategoryUpdateInput {
        categoryID: ID!
        title: String!
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
        entryID: ID
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

    type Category {
        _id: ID!
        title: String!
        budgetID: ID!
        categoryType: String!
        countUse: Int
    }

    type Entry {
        _id: ID!
        createdAt: Date!
        monthString: String
        title: String!
        value: Float!
        valueType: String!
        budgetID: ID!
        userID: User
        toUserID: User
        categoryID: ID
        individualEntry: Boolean
    }

    type MonthUser {
        userID: User
        incomeTotal: Float
        expenseTotal: Float
        balanceOfTransfer: Float
        individualIncomeTotal: Float
        individualExpenseTotal: Float
        sharedIncomeTotal: Float
        sharedExpenseTotal: Float
        percentOfTotalIncome: Float
        responsibilityTotal: Float
        responsibilityBalance: Float
        currentPersonalBalance: Float
        finalPersonalBalance: Float
    }

    type Month {
        label: String
        order: Int
        incomeTotal: Float
        expenseTotal: Float
        sharedIncomeTotal: Float
        sharedExpenseTotal: Float
        userData: [ MonthUser ]
        entries: [ Entry ]
    }

    type Budget {
        _id: ID!
        ownerIDs: [ User ]
        title: String!
        desc: String!
        categories: [ Category ]
        entries: [ Entry ]
        months: [ Month ]
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
        editTransaction( input: TransactionInput! ): Entry
        createTransfer( input: TransferInput! ): Budget
        editTransfer( input: TransferInput! ): Entry
        queryBudget( input: BudgetQueryInput! ): Budget
        queryUserBudgets( input: UserIDInput! ): [ Budget ]
        queryCategory( input: CategoryIDInput! ): Category
    }
    
`;

module.exports = typeDefs;
