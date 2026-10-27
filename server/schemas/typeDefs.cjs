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
        effectiveDate: Date!
        userID: ID!
        individualEntry: Boolean
    }

    input TransferInput {
        entryID: ID
        value: Float!
        budgetID: ID!
        effectiveDate: Date!
        userID: ID!
        toUserID: ID!
        "Optional note explaining the transfer"
        note: String
    }

    input SplitShareInput {
        userID: ID!
        percent: Float!
    }

    input SplitSettingInput {
        budgetID: ID!
        "First month the setting applies to, as YYYY-MM"
        effectiveMonth: String!
        "proportional (by shared income) or percentage (fixed shares)"
        method: String!
        shares: [ SplitShareInput ]
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
        "When the record was created. Never changes."
        createdAt: Date
        "When the record was last edited."
        updatedAt: Date
        "The date the entry applies to. Editable."
        effectiveDate: Date!
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

    type ReportEntry {
        _id: ID!
        "When the record was created. Never changes."
        createdAt: Date
        "When the record was last edited."
        updatedAt: Date
        "The date the entry applies to. Editable."
        effectiveDate: Date!
        monthString: String
        title: String!
        value: Float!
        valueIndividual: Float
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

    type SplitShare {
        userID: ID!
        percent: Float!
    }

    type SplitSetting {
        _id: ID!
        effectiveMonth: String!
        method: String!
        shares: [ SplitShare ]
    }

    type Month {
        label: String
        splitMethod: String
        splitShares: [ SplitShare ]
        order: Int
        incomeTotal: Float
        expenseTotal: Float
        transferTotals: Float
        sharedIncomeTotal: Float
        sharedExpenseTotal: Float
        userData: [ MonthUser ]
        entries: [ Entry ]
        incomeCategories: [ categoryGroup ]
        expenseCategories: [ categoryGroup ]
    }

    type ReportPeriod {
        balance: Float
        incomeTotal: Float
        expenseTotal: Float
        balanceIndividual: Float
        incomeIndividual: Float
        expenseIndividual: Float
        transferTotals: Float
        sharedBalance: Float
        sharedIncomeTotal: Float
        sharedExpenseTotal: Float
        averageResponsibilityRate: Float
        userData: [ MonthUser ]
        entries: [ ReportEntry ]  
        incomeCategories: [ categoryGroup ]
        expenseCategories: [ categoryGroup ]
    }

    type categoryGroup {        
        categoryID: ID
        total: Float
        totalIndividual: Float
    }

    type Budget {
        _id: ID!
        ownerIDs: [ User ]
        title: String!
        desc: String!
        categories: [ Category ]
        entries: [ Entry ]
        months: [ Month ]
        splitSettings: [ SplitSetting ]
    }

    type PDF {
        blob: String
    }

    type Auth {
        token: ID!
    }

    type Query {
        requestMonthlyUserReport(month: String!, user: ID!, budgetID: ID!): PDF
        requestSingleTransaction(entryID: ID!, userID: ID!, budgetID: ID!): Entry
        requestSingleTransfer(entryID: ID!, userID: ID!, budgetID: ID!): Entry
        requestCustomReport(budgetID: ID!, userID: ID!, startDate: Date!, endDate: Date!): ReportPeriod
        "Monthly summaries for the given month labels (M/yy), e.g. to page back past the initial 6 months"
        requestBudgetMonths(budgetID: ID!, months: [ String! ]!): [ Month ]
    }

    type Mutation {
        "Exchange the Auth0 ID token from sign-in for a server session token"
        login(idToken: String! ): Auth
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
        saveSplitSetting( input: SplitSettingInput! ): Budget
        deleteSplitSetting( budgetID: ID!, settingID: ID! ): Budget
    }
    
`;

module.exports = typeDefs;
