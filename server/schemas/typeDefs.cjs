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

    "A set of tires for a vehicle; tireID updates an existing set"
    input TireInput {
        vehicleID: ID!
        tireID: ID
        "e.g. Michelin Pilot Sport 4S"
        brand: String!
        "summer, winter or all-season"
        season: String!
        cost: Float
        "km already on the tires when bought"
        initialOdometer: Float
        retired: Boolean
    }

    "Correct a tire change's reading and date"
    input TireChangeUpdateInput {
        budgetID: ID!
        vehicleID: ID!
        changeID: ID!
        odometer: Float!
        date: Date
    }

    "Put a set of tires on a vehicle from an odometer reading"
    input TireChangeInput {
        budgetID: ID!
        vehicleID: ID!
        tireID: ID!
        odometer: Float!
        date: Date!
        "Sets coming off for good at this change"
        retireTireIDs: [ ID ]
    }

    "New tires bought with a maintenance record"
    input NewTireInput {
        brand: String!
        season: String!
        cost: Float
        initialOdometer: Float
    }

    "A tire change logged with a maintenance record, at its odometer reading"
    input EntryTireChangeInput {
        "An existing set for the vehicle, or newTire"
        tireID: ID
        newTire: NewTireInput
        retireTireIDs: [ ID ]
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
        "Optional tire change, logged once and linked for information; needs maintenance details with an odometer reading"
        tireChange: EntryTireChangeInput
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
        tires: [ Tire ]
        "Tire changes, oldest first"
        tireChanges: [ TireChange ]
        "Each time a set was on the vehicle, oldest first"
        tireStints: [ TireStint ]
    }

    type Tire {
        _id: ID!
        vehicleID: ID!
        brand: String!
        season: String!
        cost: Float
        initialOdometer: Float
        retired: Boolean
        "On the vehicle now"
        active: Boolean
        "km driven on this vehicle"
        usedKm: Float
        "The tires' own odometer: initial km + km driven"
        mileage: Float
        costPer100km: Float
        "How many times the set has been put on"
        installs: Int
        "When the set first went on the car"
        firstDate: Date
        "When the set last came off (now, for the set on the car)"
        lastDate: Date
    }

    type TireChange {
        _id: ID!
        odometer: Float!
        date: Date!
        "Worked out from the odometer rather than recorded"
        dateEstimated: Boolean
        tireID: ID!
        retired: [ ID ]
        entryID: ID
    }

    type TireStint {
        changeID: ID!
        tireID: ID!
        fromOdometer: Float
        toOdometer: Float
        km: Float
        fromDate: Date
        toDate: Date
        "The set on the vehicle now"
        current: Boolean
    }

    type EntryTireChange {
        tireID: ID!
        retireTireIDs: [ ID ]
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
        "The tire change logged with this maintenance record, if any"
        tireChange: EntryTireChange
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
        "Add a set of tires, or update one when tireID is given"
        saveTire( budgetID: ID!, input: TireInput! ): Budget
        "Only tires that were never put on can be deleted"
        deleteTire( budgetID: ID!, tireID: ID! ): Budget
        addTireChange( input: TireChangeInput! ): Budget
        updateTireChange( input: TireChangeUpdateInput! ): Budget
        "Undo a tire change; tires it retired come back"
        deleteTireChange( budgetID: ID!, vehicleID: ID!, changeID: ID! ): Budget
    }
    
`;

module.exports = typeDefs;
