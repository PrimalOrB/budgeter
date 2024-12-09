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
    requestSingleTransaction(entryID: $entryID, userID: $userID, budgetID: $budgetID) {
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
