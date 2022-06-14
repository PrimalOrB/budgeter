  
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

export const CREATE_NEW_TRANSFER = gql`
  mutation createTransfer($input: TransferInput! ) {
    createTransfer(input: $input) {
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
      ownerIDs {
        _id
        email
      }
      categories {
        _id
        title
        budgetID
        categoryType
        budgetedValueRange {
          order
          effectiveStartDate
          effectiveEndDate
          budgetedValue
        }
      }
      entries {
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

export const QUERY_BUDGET_CATEGORY = gql`
mutation queryCategory($input: CategoryIDInput! ) {
  queryCategory(input: $input) {
    _id
      title
      budgetID
      categoryType
      budgetedValueRange {
        order
        effectiveStartDate
        effectiveEndDate
        budgetedValue
      }
  }
}
`;