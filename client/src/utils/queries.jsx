import { gql } from "@apollo/client";
import { MONTH_FIELDS, VEHICLE_FIELDS } from "./mutations";

export const REQUEST_STATEMENT_PDF = gql`
  query requestStatement(
    $budgetID: ID!
    $userID: ID!
    $startMonth: String!
    $endMonth: String!
  ) {
    requestStatement(
      budgetID: $budgetID
      userID: $userID
      startMonth: $startMonth
      endMonth: $endMonth
    ) {
      blob
      filename
    }
  }
`;

export const QUERY_SINGLE_TRANSACTION = gql`
  query requestSingleTransaction($entryID: ID!, $userID: ID!, $budgetID: ID!) {
    requestSingleTransaction(
      entryID: $entryID
      userID: $userID
      budgetID: $budgetID
    ) {
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

export const QUERY_SINGLE_TRANSFER = gql`
  query requestSingleTransfer($entryID: ID!, $userID: ID!, $budgetID: ID!) {
    requestSingleTransfer(
      entryID: $entryID
      userID: $userID
      budgetID: $budgetID
    ) {
      _id
      createdAt
      updatedAt
      effectiveDate
      title
      value
      budgetID
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
    }
  }
`;

export const QUERY_CUSTOM_REPORT = gql`
  query requestCustomReport(
    $budgetID: ID!
    $userID: ID!
    $startDate: Date!
    $endDate: Date!
  ) {
    requestCustomReport(
      budgetID: $budgetID
      userID: $userID
      startDate: $startDate
      endDate: $endDate
    ) {
      balance
      incomeTotal
      expenseTotal
      balanceIndividual
      incomeIndividual
      expenseIndividual
      sharedBalance
      transferTotals
      sharedIncomeTotal
      sharedExpenseTotal
      averageResponsibilityRate
      entries {
        _id
        createdAt
        updatedAt
        effectiveDate
        title
        value
        valueIndividual
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
        totalIndividual
      }
      expenseCategories {
        categoryID
        total
        totalIndividual
      }
    }
  }
`;

export const REQUEST_BUDGET_MONTHS = gql`
  query requestBudgetMonths($budgetID: ID!, $months: [String!]!) {
    requestBudgetMonths(budgetID: $budgetID, months: $months) {
      ...MonthFields
    }
  }
  ${MONTH_FIELDS}
`;

export const VEHICLE_LOG = gql`
  query vehicleLog($budgetID: ID!, $vehicleID: ID!) {
    vehicleLog(budgetID: $budgetID, vehicleID: $vehicleID) {
      vehicle {
        ...VehicleFields
      }
      fills {
        odometer
        litresPer100km
        entry {
          _id
          createdAt
          updatedAt
          effectiveDate
          title
          value
          valueType
          budgetID
          categoryID
          individualEntry
          userID {
            _id
            email
            userInitials
            userColor
          }
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
      maintenance {
        _id
        createdAt
        updatedAt
        effectiveDate
        title
        value
        valueType
        budgetID
        categoryID
        individualEntry
        userID {
          _id
          email
          userInitials
          userColor
        }
        maintenance {
          vehicleID
          odometer
        }
      }
    }
  }
  ${VEHICLE_FIELDS}
`;

export const REQUEST_VEHICLE_REPORT_PDF = gql`
  query requestVehicleReport(
    $budgetID: ID!
    $vehicleID: ID!
    $startMonth: String!
    $endMonth: String!
  ) {
    requestVehicleReport(
      budgetID: $budgetID
      vehicleID: $vehicleID
      startMonth: $startMonth
      endMonth: $endMonth
    ) {
      blob
      filename
    }
  }
`;
