const typeDefs = `
    scalar Date

    input CategoryInput {
        budgetID: ID!
        title: String!
        categoryType: String!
        "Extra data entries can carry: omit for none, mileage or maintenance"
        metaType: String
    }

    input CategoryUpdateInput {
        categoryID: ID!
        title: String!
        metaType: String
    }

    "Fuel details for a transaction in a mileage category"
    input MileageInput {
        vehicleID: ID!
        pricePerLitre: Float
        litres: Float
        "km driven since the previous fill-up"
        distance: Float
    }

    "Vehicle details for a transaction in a maintenance category"
    input MaintenanceInput {
        vehicleID: ID!
        "Odometer reading when the work was done"
        odometer: Float
    }

    input VehicleInput {
        budgetID: ID!
        "Omit to add a new vehicle"
        vehicleID: ID
        make: String!
        model: String!
        year: Int
        plate: String
        color: String
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
        "Optional fuel details; only for categories with metaType mileage"
        mileage: MileageInput
        "Optional vehicle details; only for categories with metaType maintenance"
        maintenance: MaintenanceInput
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
        metaType: String
    }

    type Mileage {
        vehicleID: ID!
        pricePerLitre: Float
        litres: Float
        distance: Float
    }

    type Maintenance {
        vehicleID: ID!
        odometer: Float
    }

    type Vehicle {
        _id: ID!
        make: String!
        model: String!
        year: Int
        plate: String
        color: String
        "e.g. 2017 Subaru WRX"
        name: String!
        "Current reading: offset + all km logged against the vehicle"
        odometer: Float
        totalDistance: Float
        fillCount: Int
        maintenanceCount: Int
        maintenanceCost: Float
        "Owners who use this as their default vehicle"
        defaultFor: [ ID ]
    }

    type FuelFill {
        entry: Entry!
        "Odometer after this fill-up's distance"
        odometer: Float
        litresPer100km: Float
    }

    type VehicleLog {
        vehicle: Vehicle!
        fills: [ FuelFill ]
        "Maintenance records, oldest first"
        maintenance: [ Entry ]
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
        mileage: Mileage
        maintenance: Maintenance
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
        mileage: Mileage
        maintenance: Maintenance
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
        vehicles: [ Vehicle ]
    }

    type PDF {
        "base64-encoded PDF"
        blob: String
        filename: String
    }

    type Auth {
        token: ID!
    }

    type Query {
        requestMonthlyUserReport(month: String!, user: ID!, budgetID: ID!): PDF
        "One person's statement for whole months startMonth..endMonth (M/yy labels)"
        requestStatement(budgetID: ID!, userID: ID!, startMonth: String!, endMonth: String!): PDF
        "A vehicle's fuel and maintenance for whole months startMonth..endMonth (M/yy)"
        requestVehicleReport(budgetID: ID!, vehicleID: ID!, startMonth: String!, endMonth: String!): PDF
        requestSingleTransaction(entryID: ID!, userID: ID!, budgetID: ID!): Entry
        requestSingleTransfer(entryID: ID!, userID: ID!, budgetID: ID!): Entry
        requestCustomReport(budgetID: ID!, userID: ID!, startDate: Date!, endDate: Date!): ReportPeriod
        "Monthly summaries for the given month labels (M/yy), e.g. to page back past the initial 6 months"
        requestBudgetMonths(budgetID: ID!, months: [ String! ]!): [ Month ]
        "Every fill-up and maintenance record logged against a vehicle, oldest first"
        vehicleLog(budgetID: ID!, vehicleID: ID!): VehicleLog
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
        "Permanently delete a transaction or transfer; returns its ID"
        deleteEntry( budgetID: ID!, entryID: ID! ): ID
        saveSplitSetting( input: SplitSettingInput! ): Budget
        deleteSplitSetting( budgetID: ID!, settingID: ID! ): Budget
        "Add a vehicle, or update one when vehicleID is given"
        saveVehicle( input: VehicleInput! ): Budget
        "Only vehicles with no fill-ups or maintenance can be deleted"
        deleteVehicle( budgetID: ID!, vehicleID: ID! ): Budget
        "Make a vehicle the signed-in user's default; null clears it"
        setDefaultVehicle( budgetID: ID!, vehicleID: ID ): Budget
        "Correct the odometer to a reading; later fill-ups add to it"
        setVehicleOdometer( budgetID: ID!, vehicleID: ID!, odometer: Float! ): Budget
    }
    
`;

module.exports = typeDefs;
