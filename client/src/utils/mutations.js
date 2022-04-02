  
import { gql } from '@apollo/client';

export const LOGIN_USER = gql`
  mutation login($email: String! ) {
    login(email: $email) {
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

export const QUERY_CURRENT_BUDGET = gql`
  mutation queryBudget($input: BudgetQueryInput! ) {
    queryBudget(input: $input) {
      _id
      title
      desc
    }
  }
`;