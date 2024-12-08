import { gql } from "@apollo/client";

export const REQUEST_MONTHLY_USER_REPORT_PDF = gql`
  query requestMonthlyUserReport($month: String!, $user: ID!, $budgetID: ID!) {
    requestMonthlyUserReport(month: $month, user: $user, budgetID: $budgetID) {
      blob
    }
  }
`;