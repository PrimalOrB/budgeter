const { User, Budget, Category, Entry } = require("../models/index.cjs");
const { AuthenticationError, UserInputError } = require("@apollo/server");
const mongoose = require("mongoose");
const { signToken } = require("../utils/auth.cjs");
const dateScalar = require("./dateScalar.cjs");
const {
  extractPropAsStrToArr,
  dateToMonthStr,
  createMonthLabelFromOffset,
  createMonthObj,
  createMonthlyCategoryObj,
  copyObject,
  parseMonthlyEntries,
  parseMonthlyBalances,
  fixRounding,
} = require("../utils/helpers.cjs");
const build_PDF_MonthlyReport = require("../utils/build_PDF_monthlyReport.cjs");
const { eachMonthOfInterval } = require("date-fns");

const resolvers = {
  Date: dateScalar,

  Query: {
    requestMonthlyUserReport: async (
      parent,
      { month, user, budgetID },
      context
    ) => {
      if (context.token.headers.authorization !== undefined) {
        // Create Month
        const createdMonth = createMonthObj(month);

        // Get budget data
        const findBudget = await Budget.findOne({ _id: budgetID })
          .populate("categories")
          .populate("ownerIDs")
          .populate("entries");

        if (!findBudget) {
          return {};
        }

        // gather owner IDs
        const owners = extractPropAsStrToArr(findBudget.ownerIDs, "_id");

        // ensure user is authorized
        const userMatch = owners.includes(user);
        if (!userMatch) {
          throw new UserInputError("Incorrect credentials");
        }

        // Get data for each monmth
        const monthlyEntries = await Entry.find({
          budgetID: findBudget._id,
          monthString: createdMonth.label,
        })
          .populate("userID")
          .populate("toUserID");

        createdMonth.entries = [...monthlyEntries];

        // Populate entries
        const populatedMonth = parseMonthlyEntries(createdMonth);

        // Balancing Calculations
        const balancedMonth = parseMonthlyBalances(populatedMonth);

        findBudget.months = [balancedMonth];

        const report = await build_PDF_MonthlyReport(findBudget, user);

        let bufferStr = Buffer.from(report, "utf8");

        const base64 = bufferStr.toString("base64");

        return { blob: base64 };
      }
      throw new AuthenticationError("Incorrect credentials");
    },
    requestSingleTransaction: async (
      parent,
      { entryID, userID, budgetID },
      context
    ) => {
      if (context.token.headers.authorization !== undefined) {
        const user = await User.findOne({ _id: userID });

        if (!user) {
          throw new AuthenticationError("Incorrect credentials");
        }

        const findEntry = await Entry.findOne({ _id: entryID })
          .populate("userID")
          .populate("toUserID");

        if (!findEntry) {
          throw new AuthenticationError("No Entry Found");
        }

        const findBudget = await Budget.findOne({ _id: budgetID });

        if (!findBudget) {
          throw new AuthenticationError("No Budget Found");
        }

        const entryMatchesBudget = findEntry.budgetID.equals(budgetID);

        if (!entryMatchesBudget) {
          throw new AuthenticationError("Budget Does Not Contain Entry");
        }

        // gather owner IDs
        const owners = extractPropAsStrToArr(findBudget.ownerIDs, "_id");

        // ensure user is authorized
        const userMatch = owners.includes(userID);

        if (!userMatch) {
          throw new AuthenticationError("User Not Authorized");
        }

        return findEntry;
      }
      throw new AuthenticationError("Incorrect credentials");
    },
    requestSingleTransfer: async (
      parent,
      { entryID, userID, budgetID },
      context
    ) => {
      if (context.token.headers.authorization !== undefined) {
        const user = await User.findOne({ _id: userID });

        if (!user) {
          throw new AuthenticationError("Incorrect credentials");
        }

        const findEntry = await Entry.findOne({ _id: entryID })
          .populate("userID")
          .populate("toUserID");

        if (!findEntry) {
          throw new AuthenticationError("No Entry Found");
        }

        const findBudget = await Budget.findOne({ _id: budgetID });

        if (!findBudget) {
          throw new AuthenticationError("No Budget Found");
        }

        const entryMatchesBudget = findEntry.budgetID.equals(budgetID);

        if (!entryMatchesBudget) {
          throw new AuthenticationError("Budget Does Not Contain Entry");
        }

        // gather owner IDs
        const owners = extractPropAsStrToArr(findBudget.ownerIDs, "_id");

        // ensure user is authorized
        const userMatch = owners.includes(userID);

        if (!userMatch) {
          throw new AuthenticationError("User Not Authorized");
        }

        return findEntry;
      }
      throw new AuthenticationError("Incorrect credentials");
    },
    requestCustomReport: async (
      parent,
      { budgetID, userID, startDate, endDate },
      context
    ) => {
      if (context.token.headers.authorization !== undefined) {
        console.log(budgetID, userID, startDate, endDate);

        const user = await User.findOne({ _id: userID });

        if (!user) {
          throw new AuthenticationError("Incorrect credentials");
        }

        const findBudget = await Budget.findOne({ _id: budgetID });

        if (!findBudget) {
          throw new AuthenticationError("No Budget Found");
        }

        // gather owner IDs
        const owners = extractPropAsStrToArr(findBudget.ownerIDs, "_id");

        // ensure user is authorized
        const userMatch = owners.includes(userID);

        if (!userMatch) {
          throw new AuthenticationError("User Not Authorized");
        }

        const monthsBetweenDates = eachMonthOfInterval({
            start: startDate,
            end: endDate,
          }),
          createdMonths = [];
        monthsBetweenDates
          .sort((a, b) => b - a)
          .map((date, i) => {
            return createdMonths.push(createMonthObj(dateToMonthStr(date), i));
          });

        // Get data for each monmth
        const newMonths = [];
        const queryEachMonth = createdMonths.map(async (month) => {
          const monthlyEntries = await Entry.find({
            budgetID: findBudget._id,
            monthString: month.label,
          })
            .populate("userID")
            .populate("toUserID");
          const findMonthInArr = createdMonths.find(
            (findMonth) => findMonth.label === month.label
          );
          findMonthInArr.entries = [...monthlyEntries];
          return newMonths.push(findMonthInArr);
        });
        await Promise.all(queryEachMonth);

        const populatedMonths = [];
        const populateMonths = newMonths
          .sort((a, b) => a.order - b.order)
          .map((month) => {
            return populatedMonths.push(parseMonthlyEntries(month));
          });
        await Promise.all(populateMonths);

        // Balancing Calculations
        const balanedMonths = populatedMonths.map((month) => {
          return parseMonthlyBalances(month);
        });
        await Promise.all(balanedMonths);

        let reportTotals = {
          label: "",
          order: 1,
          balance: 0,
          incomeTotal: 0,
          expenseTotal: 0,
          balanceIndividual: 0,
          incomeIndividual: 0,
          expenseIndividual: 0,
          transferTotals: 0,
          sharedBalance: 0,
          sharedIncomeTotal: 0,
          sharedExpenseTotal: 0,
          userData: [],
          entries: [],
          incomeCategories: [],
          expenseCategories: [],
        };

        // ADD TOTALS
        populatedMonths.map((month) => {
          reportTotals.incomeTotal = fixRounding(
            reportTotals.incomeTotal + month.incomeTotal,
            2
          );
          reportTotals.expenseTotal = fixRounding(
            reportTotals.expenseTotal + month.expenseTotal,
            2
          );
          reportTotals.transferTotals = fixRounding(
            reportTotals.transferTotals + month.transferTotals,
            2
          );
          reportTotals.sharedIncomeTotal = fixRounding(
            reportTotals.sharedIncomeTotal + month.sharedIncomeTotal,
            2
          );
          reportTotals.sharedExpenseTotal = fixRounding(
            reportTotals.sharedExpenseTotal + month.sharedExpenseTotal,
            2
          );

          const monthUser = month.userData.find((user) =>
            user.userID._id.equals(userID)
          );

          // MAP PER MONTH VALUES FOR USER
          month.entries.map((entry, i) => {
            entry.valueIndividual = fixRounding(
              entry.valueIndividual +
                entry.value *
                  (entry.individualEntry
                    ? entry.userID._id.equals(userID)
                      ? 1
                      : 0
                    : monthUser.percentOfTotalIncome),
              2
            );

            // MAP INCOME ENTRIES
            if (entry.valueType === "income") {
              // add to user value
              reportTotals.incomeIndividual = fixRounding(
                reportTotals.incomeIndividual +
                  entry.value * (entry.userID._id.equals(userID) ? 1 : 0),
                2
              );

              // get monthly category value
              let indexOfCategory = reportTotals.incomeCategories.findIndex(
                (category) =>
                  category.categoryID?._id.equals(entry.categoryID._id)
              );
              if (indexOfCategory < 0) {
                const createdCategory = copyObject(createMonthlyCategoryObj());
                createdCategory.categoryID = entry.categoryID;
                indexOfCategory = reportTotals.incomeCategories.length;
                reportTotals.incomeCategories[indexOfCategory] =
                  createdCategory;
              }
              reportTotals.incomeCategories[indexOfCategory].total =
                fixRounding(
                  reportTotals.incomeCategories[indexOfCategory].total +
                    entry.value,
                  2
                );

              reportTotals.incomeCategories[indexOfCategory].totalIndividual =
                fixRounding(
                  reportTotals.incomeCategories[indexOfCategory]
                    .totalIndividual +
                    entry.value *
                      (entry.individualEntry
                        ? entry.userID._id.equals(userID)
                          ? 1
                          : 0
                        : monthUser.percentOfTotalIncome),
                  2
                );
            }

            // MAP EXPENSE ENTRIES
            if (entry.valueType === "expense") {
              // add to user value
              reportTotals.expenseIndividual = fixRounding(
                reportTotals.expenseIndividual +
                  entry.value *
                    (entry.individualEntry
                      ? entry.userID._id.equals(userID)
                        ? 1
                        : 0
                      : monthUser.percentOfTotalIncome),
                2
              );

              // get monthly category value
              let indexOfCategory = reportTotals.expenseCategories.findIndex(
                (category) =>
                  category.categoryID?._id.equals(entry.categoryID._id)
              );
              if (indexOfCategory < 0) {
                const createdCategory = copyObject(createMonthlyCategoryObj());
                createdCategory.categoryID = entry.categoryID;
                indexOfCategory = reportTotals.expenseCategories.length;
                reportTotals.expenseCategories[indexOfCategory] =
                  createdCategory;
              }
              reportTotals.expenseCategories[indexOfCategory].total =
                fixRounding(
                  reportTotals.expenseCategories[indexOfCategory].total +
                    entry.value,
                  2
                );

              reportTotals.expenseCategories[indexOfCategory].totalIndividual =
                fixRounding(
                  reportTotals.expenseCategories[indexOfCategory]
                    .totalIndividual +
                    entry.value *
                      (entry.individualEntry
                        ? entry.userID._id.equals(userID)
                          ? 1
                          : 0
                        : monthUser.percentOfTotalIncome),
                  2
                );
            }
            reportTotals.entries.push(entry);
          });
        });

        // BALANCES
        reportTotals.balance = fixRounding(
          reportTotals.incomeTotal - reportTotals.expenseTotal,
          2
        );
        reportTotals.balanceIndividual = fixRounding(
          reportTotals.incomeIndividual - reportTotals.expenseIndividual,
          2
        );
        reportTotals.sharedBalance = fixRounding(
          reportTotals.sharedIncomeTotal - reportTotals.sharedExpenseTotal,
          2
        );

        findBudget.months = populatedMonths;

        // return findEntry
        return reportTotals;
      }
      throw new AuthenticationError("Incorrect credentials");
    },
  },

  Mutation: {
    login: async (parent, { email }, context) => {
      if (context.token.headers.authorization !== undefined) {
        let _id;

        // check for user
        const checkUser = await User.findOne({ email: email });

        // if user, assign _id
        if (checkUser) {
          _id = checkUser._id;
        }

        // if no user, create user
        if (!checkUser) {
          const createUser = await User.create({ email });
          _id = createUser._id;
        }

        // once _id verified, sign token
        if (_id) {
          const token = signToken({ email, _id });
          return { token };
        }

        throw new AuthenticationError("No User Account");
      }
      throw new AuthenticationError("Incorrect credentials");
    },

    createBudget: async (parent, data, context) => {
      if (context.token.headers.authorization !== undefined) {
        const ownerIDs = [];
        const findOwner = await User.findOne({ email: data.input.owner });
        if (findOwner) {
          ownerIDs.push(findOwner._id);
        }

        for (let i = 0; i < data.input.emails.length; i++) {
          const findAdditionalOwner = await User.findOne({
            email: data.input.emails[i],
          });
          if (findAdditionalOwner) {
            ownerIDs.push(findAdditionalOwner._id);
          }
        }

        const newBudget = {
          ownerIDs: [...ownerIDs],
          title: data.input.title,
          desc: data.input.desc,
        };

        // create budget
        const createBudget = await Budget.create({ ...newBudget });

        return createBudget;
      }
      throw new AuthenticationError("Incorrect credentials");
    },

    createCategory: async (parent, { input }, context) => {
      if (context.token.headers.authorization !== undefined) {
        const { budgetID } = input;

        const createBudgetCategory = await Category.create(input);

        const addedToBudget = await Budget.findOneAndUpdate(
          { _id: budgetID },
          { $push: { categories: createBudgetCategory._id } },
          { new: true, runValidators: true }
        );

        return addedToBudget;
      }
      throw new AuthenticationError("Incorrect credentials");
    },

    updateCategory: async (parent, { input }, context) => {
      if (context.token.headers.authorization !== undefined) {
        const { categoryID, title, budgetedValueRange } = input;

        const updatedCategory = await Category.findOneAndUpdate(
          { _id: categoryID },
          { title, budgetedValueRange },
          { new: true, runValidators: true }
        );

        return updatedCategory;
      }
      throw new AuthenticationError("Incorrect credentials");
    },

    createTransaction: async (parent, { input }, context) => {
      if (context.token.headers.authorization !== undefined) {
        let { budgetID, categoryID, userID, individualEntry } = input;

        individualEntry = individualEntry || false;

        const user = await User.findOne({ _id: userID });

        if (!user) {
          return {};
        }

        const matchCategory = await Category.findOneAndUpdate(
          { _id: categoryID },
          { $inc: { countUse: 1 } },
          { new: true }
        );

        if (!matchCategory) {
          return {};
        }

        const newEntry = await Entry.create({
          ...input,
          userID: user._id,
          valueType: matchCategory.categoryType,
          individualEntry,
        });

        const budgetUpdate = await Budget.findOneAndUpdate(
          { _id: budgetID },
          { $push: { entries: newEntry._id } },
          { new: true, runValidators: true }
        );

        if (!budgetUpdate) {
          return {};
        }

        return budgetUpdate;
      }
      throw new AuthenticationError("Incorrect credentials");
    },

    editTransaction: async (parent, { input }, context) => {
      if (context.token.headers.authorization !== undefined) {
        let {
          entryID,
          title,
          value,
          categoryID,
          createdAt,
          userID,
          individualEntry,
        } = input;

        individualEntry = individualEntry || false;

        const user = await User.findOne({ _id: userID });

        if (!user) {
          return {};
        }

        const matchCategory = await Category.findOne({ _id: categoryID });

        if (!matchCategory) {
          return {};
        }

        const monthString = dateToMonthStr(createdAt);

        const entryUpdate = await Entry.findOneAndUpdate(
          { _id: entryID },
          {
            title,
            value,
            categoryID,
            createdAt,
            monthString,
            userID,
            individualEntry,
          },
          { new: true, runValidators: true }
        ).populate("userID");

        if (!entryUpdate) {
          return {};
        }

        return entryUpdate;
      }
      throw new AuthenticationError("Incorrect credentials");
    },

    createTransfer: async (parent, { input }, context) => {
      if (context.token.headers.authorization !== undefined) {
        let { budgetID, userID, toUserID } = input;

        const user = await User.findOne({ _id: userID });

        if (!user) {
          return {};
        }

        const userTo = await User.findOne({ _id: toUserID });

        if (!userTo) {
          return {};
        }

        const newEntry = await Entry.create({
          ...input,
          userID: user._id,
          valueType: "transfer",
          title: `Transfer from ${user.userInitials} to ${userTo.userInitials}`,
        });

        const budgetUpdate = await Budget.findOneAndUpdate(
          { _id: budgetID },
          { $push: { entries: newEntry._id } },
          { new: true, runValidators: true }
        );

        if (!budgetUpdate) {
          return {};
        }

        return budgetUpdate;
      }
      throw new AuthenticationError("Incorrect credentials");
    },

    editTransfer: async (parent, { input }, context) => {
      if (context.token.headers.authorization !== undefined) {
        let { entryID, value, createdAt, userID, toUserID } = input;

        const user = await User.findOne({ _id: userID });

        if (!user) {
          return {};
        }

        const userTo = await User.findOne({ _id: toUserID });

        if (!userTo) {
          return {};
        }

        const monthString = dateToMonthStr(createdAt);

        const updateEntry = await Entry.findOneAndUpdate(
          { _id: entryID },
          {
            entryID,
            value,
            createdAt,
            monthString,
            userID,
            toUserID,
            title: `Transfer from ${user.userInitials} to ${userTo.userInitials}`,
          },
          { new: true, runValidators: true }
        )
          .populate("userID")
          .populate("toUserID");

        if (!updateEntry) {
          return {};
        }

        return updateEntry;
      }
      throw new AuthenticationError("Incorrect credentials");
    },

    queryBudget: async (parent, { input }, context) => {
      if (context.token.headers.authorization !== undefined) {
        const lengthOfInitialQuery = 6;

        // Create Filler Months
        const createdMonths = [];
        new Array(lengthOfInitialQuery).fill().map((_, offset) => {
          const label = createMonthLabelFromOffset(offset);
          return createdMonths.push(createMonthObj(label, offset));
        });
        // Get budget data
        const findBudget = await Budget.findOne({ _id: input.budget })
          .populate("categories")
          .populate("ownerIDs")
          .populate("entries");

        // gather owner IDs
        const owners = extractPropAsStrToArr(findBudget.ownerIDs, "_id");

        // ensure user is authorized
        const userMatch = owners.includes(input.user);
        if (!userMatch) {
          throw new UserInputError("Incorrect credentials");
        }

        // Get data for each monmth
        const newMonths = [];
        const queryEachMonth = createdMonths.map(async (month) => {
          const monthlyEntries = await Entry.find({
            budgetID: findBudget._id,
            monthString: month.label,
          })
            .populate("userID")
            .populate("toUserID");
          const findMonthInArr = createdMonths.find(
            (findMonth) => findMonth.label === month.label
          );
          findMonthInArr.entries = [...monthlyEntries];
          return newMonths.push(findMonthInArr);
        });
        await Promise.all(queryEachMonth);

        const populatedMonths = [];
        const populateMonths = newMonths
          .sort((a, b) => a.order - b.order)
          .map((month) => {
            return populatedMonths.push(parseMonthlyEntries(month));
          });
        await Promise.all(populateMonths);

        // Balancing Calculations
        const balanedMonths = populatedMonths.map((month) => {
          return parseMonthlyBalances(month);
        });
        await Promise.all(balanedMonths);

        findBudget.months = populatedMonths;

        if (!findBudget) {
          return {};
        }

        return findBudget;
      }
      throw new AuthenticationError("Incorrect credentials");
    },

    queryUserBudgets: async (parent, { input }, context) => {
      if (context.token.headers.authorization !== undefined) {
        // find budget with ownerID containing userID
        const findBudgets = await Budget.find({
          ownerIDs: { $all: [input._id] },
        });
        if (findBudgets.length === 0) {
          return [];
        }

        return findBudgets;
      }
      throw new AuthenticationError("Incorrect credentials");
    },

    queryCategory: async (parent, { input }, context) => {
      if (context.token.headers.authorization !== undefined) {
        const matchCategory = await Category.findOne({ _id: input._id });

        if (!matchCategory) {
          return {};
        }

        return matchCategory;
      }
      throw new AuthenticationError("Incorrect credentials");
    },
  },
};

module.exports = resolvers;
