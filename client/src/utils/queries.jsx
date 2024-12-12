import { gql } from "@apollo/client";

export const REQUEST_MONTHLY_USER_REPORT_PDF = gql`
  query requestMonthlyUserReport($month: String!, $user: ID!, $budgetID: ID!) {
    requestMonthlyUserReport(month: $month, user: $user, budgetID: $budgetID) {
      blob
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
