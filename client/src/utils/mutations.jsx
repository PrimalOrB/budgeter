  
import { gql } from '@apollo/client';

export const VEHICLE_FIELDS = gql`
  fragment VehicleFields on Vehicle {
    _id
    make
    model
    year
    plate
    color
    name
    odometer
    totalDistance
    fillCount
    maintenanceCount
    maintenanceCost
    tires {
      _id
      brand
      season
      cost
      retired
      active
      firstDate
    }
    defaultFor
  }
`;

// everything the dashboard needs for one month
export const MONTH_FIELDS = gql`
  fragment MonthFields on Month {
    label
    order
    splitMethod
    splitShares {
      userID
      percent
    }
    incomeTotal
    expenseTotal
    sharedIncomeTotal
    sharedExpenseTotal
    transferTotals
    userData {
      userID {
        _id
        email
        userInitials
        userColor
      }
      incomeTotal
      expenseTotal
      balanceOfTransfer
      individualIncomeTotal
      individualExpenseTotal
      sharedIncomeTotal
      sharedExpenseTotal
      percentOfTotalIncome
      responsibilityTotal
      responsibilityBalance
      currentPersonalBalance
      finalPersonalBalance
    }
    entries {
      _id
      createdAt
      updatedAt
      effectiveDate
      title
      value
      valueType
      budgetID
      categoryID
      userID {
        _id
        email
        userInitials
        userColor
      }
      toUserID {
        _id
        email
        userInitials
        userColor
      }
      individualEntry
      mileage {
        vehicleID
        pricePerLitre
        litres
        distance
      }
      maintenance {
        vehicleID
        odometer
      }
    }
    incomeCategories {
      categoryID
      total
    }
    expenseCategories {
      categoryID
      total
    }
  }
`;

export const LOGIN_USER = gql`
  mutation login($idToken: String! ) {
    login(idToken: $idToken) {
      token
    }
  }
`;

export const CREATE_NEW_BUDGET = gql`
  mutation createBudget($input: BudgetInput! ) {
    createBudget(input: $input) {
      _id
    }
  }
`;

export const CREATE_NEW_BUDGET_CATEGORY = gql`
  mutation createCategory($input: CategoryInput! ) {
    createCategory(input: $input) {
      _id
    }
  }
`;

export const UPDATE_BUDGET_CATEGORY = gql`
  mutation updateCategory($input: CategoryUpdateInput! ) {
    updateCategory(input: $input) {
      _id
    }
  }
`;

export const CREATE_NEW_TRANSACTION = gql`
  mutation createTransaction($input: TransactionInput! ) {
    createTransaction(input: $input) {
      _id
    }
  }
`;

export const EDIT_TRANSACTION = gql`
  mutation editTransaction($input: TransactionInput! ) {
    editTransaction(input: $input) {
      _id
      createdAt
      updatedAt
      effectiveDate
      title
      value
      valueType
      budgetID
      categoryID
      userID {
        _id
        email
        userInitials
        userColor
      }
      toUserID {
        _id
        email
        userInitials
        userColor
      }
      individualEntry
      mileage {
        vehicleID
        pricePerLitre
        litres
        distance
      }
      maintenance {
        vehicleID
        odometer
      }
    }
  }
`;

export const CREATE_NEW_TRANSFER = gql`
  mutation createTransfer($input: TransferInput! ) {
    createTransfer(input: $input) {
      _id
    }
  }
`;

export const EDIT_TRANSFER = gql`
  mutation editTransfer($input: TransferInput! ) {
    editTransfer(input: $input) {
      _id
      createdAt
      updatedAt
      effectiveDate
      title
      value
      valueType
      budgetID
      categoryID
      userID {
        _id
        email
        userInitials
        userColor
      }
      toUserID {
        _id
        email
        userInitials
        userColor
      }
      individualEntry
      mileage {
        vehicleID
        pricePerLitre
        litres
        distance
      }
      maintenance {
        vehicleID
        odometer
      }
    }
  }
`;

export const QUERY_CURRENT_BUDGET = gql`
  mutation queryBudget($input: BudgetQueryInput! ) {
    queryBudget(input: $input) {
      _id
      title
      desc
      ownerIDs {
        _id
        email
        userInitials
        userColor
      }
      vehicles {
        ...VehicleFields
      }
      splitSettings {
        _id
        effectiveMonth
        method
        shares {
          userID
          percent
        }
      }
      categories {
        _id
        title
        budgetID
        categoryType
        countUse
        metaType
      }
      months {
        ...MonthFields
      }
    }
  }
  ${MONTH_FIELDS}
  ${VEHICLE_FIELDS}
`;

export const QUERY_ALL_USER_BUDGETS = gql`
  mutation queryUserBudgets($input: UserIDInput! ) {
    queryUserBudgets(input: $input) {
      _id
      title
      desc
    }
  }
`;

export const QUERY_BUDGET_CATEGORY = gql`
mutation queryCategory($input: CategoryIDInput! ) {
  queryCategory(input: $input) {
    _id
      title
      budgetID
      categoryType
      countUse
      metaType
    }
  }
`;

const SPLIT_SETTINGS_FIELDS = `
  _id
  splitSettings {
    _id
    effectiveMonth
    method
    shares {
      userID
      percent
    }
  }
`;

export const SAVE_SPLIT_SETTING = gql`
  mutation saveSplitSetting($input: SplitSettingInput!) {
    saveSplitSetting(input: $input) {
      ${SPLIT_SETTINGS_FIELDS}
    }
  }
`;

export const DELETE_SPLIT_SETTING = gql`
  mutation deleteSplitSetting($budgetID: ID!, $settingID: ID!) {
    deleteSplitSetting(budgetID: $budgetID, settingID: $settingID) {
      ${SPLIT_SETTINGS_FIELDS}
    }
  }
`;

export const DELETE_ENTRY = gql`
  mutation deleteEntry($budgetID: ID!, $entryID: ID!) {
    deleteEntry(budgetID: $budgetID, entryID: $entryID)
  }
`;

const BUDGET_VEHICLES = `
  _id
  vehicles {
    ...VehicleFields
  }
`;

export const SAVE_VEHICLE = gql`
  mutation saveVehicle($input: VehicleInput!) {
    saveVehicle(input: $input) {
      ${BUDGET_VEHICLES}
    }
  }
  ${VEHICLE_FIELDS}
`;

export const DELETE_VEHICLE = gql`
  mutation deleteVehicle($budgetID: ID!, $vehicleID: ID!) {
    deleteVehicle(budgetID: $budgetID, vehicleID: $vehicleID) {
      ${BUDGET_VEHICLES}
    }
  }
  ${VEHICLE_FIELDS}
`;

export const SET_DEFAULT_VEHICLE = gql`
  mutation setDefaultVehicle($budgetID: ID!, $vehicleID: ID) {
    setDefaultVehicle(budgetID: $budgetID, vehicleID: $vehicleID) {
      ${BUDGET_VEHICLES}
    }
  }
  ${VEHICLE_FIELDS}
`;

export const SAVE_TIRE = gql`
  mutation saveTire($budgetID: ID!, $input: TireInput!) {
    saveTire(budgetID: $budgetID, input: $input) {
      ${BUDGET_VEHICLES}
    }
  }
  ${VEHICLE_FIELDS}
`;

export const DELETE_TIRE = gql`
  mutation deleteTire($budgetID: ID!, $tireID: ID!) {
    deleteTire(budgetID: $budgetID, tireID: $tireID) {
      ${BUDGET_VEHICLES}
    }
  }
  ${VEHICLE_FIELDS}
`;

export const ADD_TIRE_CHANGE = gql`
  mutation addTireChange($input: TireChangeInput!) {
    addTireChange(input: $input) {
      ${BUDGET_VEHICLES}
    }
  }
  ${VEHICLE_FIELDS}
`;

export const UPDATE_TIRE_CHANGE = gql`
  mutation updateTireChange($input: TireChangeUpdateInput!) {
    updateTireChange(input: $input) {
      ${BUDGET_VEHICLES}
    }
  }
  ${VEHICLE_FIELDS}
`;

export const DELETE_TIRE_CHANGE = gql`
  mutation deleteTireChange($budgetID: ID!, $vehicleID: ID!, $changeID: ID!) {
    deleteTireChange(budgetID: $budgetID, vehicleID: $vehicleID, changeID: $changeID) {
      ${BUDGET_VEHICLES}
    }
  }
  ${VEHICLE_FIELDS}
`;

export const SET_VEHICLE_ODOMETER = gql`
  mutation setVehicleOdometer($budgetID: ID!, $vehicleID: ID!, $odometer: Float!) {
    setVehicleOdometer(budgetID: $budgetID, vehicleID: $vehicleID, odometer: $odometer) {
      ${BUDGET_VEHICLES}
    }
  }
  ${VEHICLE_FIELDS}
`;
