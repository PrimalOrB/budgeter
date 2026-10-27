  
import { gql } from '@apollo/client';

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
      }
      months {
        ...MonthFields
      }
    }
  }
  ${MONTH_FIELDS}
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
