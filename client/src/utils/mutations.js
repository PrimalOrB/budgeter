  
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

export const CREATE_NEW_BUDGET_CATEGORY = gql`
  mutation createCategory($input: CategoryInput! ) {
    createCategory(input: $input) {
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
      categories {
        _id
        title
        categoryType
      }
    }
  }
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