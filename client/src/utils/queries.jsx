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

export const QUERY_SINGLE_TRANSFER = gql`
  query requestSingleTransfer($entryID: ID!, $userID: ID!, $budgetID: ID!) {
    requestSingleTransfer(entryID: $entryID, userID: $userID, budgetID: $budgetID) {
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
