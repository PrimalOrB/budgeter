const { User, Budget, Category, Entry } = require("../models/index.cjs");
const { AuthenticationError, UserInputError } = require("@apollo/server");
const mongoose = require("mongoose");
const { signToken } = require("../utils/auth.cjs");
const dateScalar = require("./dateScalar.cjs");
const {
  extractPropAsStrToArr,
  dateToMonthStr,
  fixRounding,
  copyObject,
} = require("../utils/helpers.cjs");
const { sub } = require("date-fns");

const resolvers = {
  Date: dateScalar,

  Query: {},

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

        const defaultMonth = {
            label: "",
            incomeTotal: 0,
            expenseTotal: 0,
            sharedIncomeTotal: 0,
            sharedExpenseTotal: 0,
            userData: {},
            entries: [],
          },
          defaultUser = {
            incomeTotal: 0,
            expenseTotal: 0,
            balanceOfTransfer: 0,
            individualIncomeTotal: 0,
            individualExpenseTotal: 0,
            sharedIncomeTotal: 0,
            sharedExpenseTotal: 0,
            percentOfTotalIncome: 0,
            responsibilityTotal: 0,
            responsibilityBalance: 0,
            currentPersonalBalance: 0,
            finalPersonalBalance: 0,
          };

        const createdMonths = [];
        new Array(lengthOfInitialQuery).fill().map((x, i) => {
          const createDate = sub(new Date(), { months: i }),
            label = dateToMonthStr(createDate);
          const month = copyObject(defaultMonth);
          month.label = label;
          month.order = i;
          return createdMonths.push(month);
        });

        const findBudgetNew = await Budget.findOne({ _id: input.budget })
          .populate("categories")
          .populate("ownerIDs");

        // gather owner IDs
        const owners = extractPropAsStrToArr(findBudgetNew.ownerIDs, "_id");

        // ensure user is authorized
        const userMatch = owners.includes(input.user);
        if (!userMatch) {
          throw new UserInputError("Incorrect credentials");
        }

        // get data for each monmth
        const newMonths = [];
        const queryEachMonth = createdMonths.map(async (month) => {
          const monthlyEntries = await Entry.find({
            budgetID: findBudgetNew._id,
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
        newMonths
          .sort((a, b) => a.order - b.order)
          .map((month) => {
            const monthData = { ...month };
            month.entries.map((entry) => {
              if (!monthData.userData[entry.userID._id]) {
                monthData.userData[entry.userID._id] = copyObject(defaultUser);
              }
              if (entry?.toUserID) {
                if (!monthData.userData[entry.toUserID._id]) {
                  monthData.userData[entry.toUserID._id] =
                    copyObject(defaultUser);
                }
              }
              // income
              if (entry.valueType === "income") {
                monthData.incomeTotal = fixRounding(
                  monthData.incomeTotal + entry.value,
                  2
                );
                monthData.userData[entry.userID._id].incomeTotal = fixRounding(
                  monthData.userData[entry.userID._id].incomeTotal +
                    entry.value,
                  2
                );
                if (!entry.individualEntry) {
                  monthData.sharedIncomeTotal = fixRounding(
                    monthData.sharedIncomeTotal + entry.value,
                    2
                  );
                  monthData.userData[entry.userID._id].sharedIncomeTotal =
                    fixRounding(
                      monthData.userData[entry.userID._id].sharedIncomeTotal +
                        entry.value,
                      2
                    );
                } else {
                  monthData.userData[entry.userID._id].individualIncomeTotal =
                    fixRounding(
                      monthData.userData[entry.userID._id]
                        .individualIncomeTotal + entry.value,
                      2
                    );
                }
              }
              // expenses
              if (entry.valueType === "expense") {
                monthData.expenseTotal = fixRounding(
                  monthData.expenseTotal + entry.value,
                  2
                );
                monthData.userData[entry.userID._id].expenseTotal = fixRounding(
                  monthData.userData[entry.userID._id].expenseTotal +
                    entry.value,
                  2
                );
                if (!entry.individualEntry) {
                  monthData.sharedExpenseTotal = fixRounding(
                    monthData.sharedExpenseTotal + entry.value,
                    2
                  );
                  monthData.userData[entry.userID._id].sharedExpenseTotal =
                    fixRounding(
                      monthData.userData[entry.userID._id].sharedExpenseTotal +
                        entry.value,
                      2
                    );
                } else {
                  monthData.userData[entry.userID._id].individualExpenseTotal =
                    fixRounding(
                      monthData.userData[entry.userID._id]
                        .individualExpenseTotal + entry.value,
                      2
                    );
                }
              }
              // transfers
              if (entry.valueType === "transfer") {
                monthData.userData[entry.userID._id].balanceOfTransfer =
                  fixRounding(
                    monthData.userData[entry.userID._id].balanceOfTransfer -
                      entry.value,
                    2
                  );
                monthData.userData[entry.toUserID._id].balanceOfTransfer =
                  fixRounding(
                    monthData.userData[entry.toUserID._id].balanceOfTransfer +
                      entry.value,
                    2
                  );
              }
            });
            populatedMonths.push({ ...monthData });
          });

        // Balancing Calculations
        populatedMonths.map((month) => {
          Object.values(month.userData).map((data) => {
            // Responsibility
            data.percentOfTotalIncome =
              data.sharedIncomeTotal / month.sharedIncomeTotal;
            data.responsibilityTotal = fixRounding(
              month.sharedExpenseTotal * data.percentOfTotalIncome,
              2
            );
            // Balance
            data.responsibilityBalance = fixRounding(
              data.responsibilityTotal -
                data.sharedExpenseTotal +
                data.balanceOfTransfer,
              2
            );
            // Remainder
            data.currentPersonalBalance = fixRounding(
              data.incomeTotal - data.expenseTotal + data.balanceOfTransfer,
              2
            );
            data.finalPersonalBalance = fixRounding(
              data.incomeTotal -
                data.expenseTotal +
                data.balanceOfTransfer -
                data.responsibilityBalance,
              2
            );
          });
        });

        // find budget by ID
        const findBudget = await Budget.findOne({ _id: input.budget })
          .populate("categories")
          .populate("ownerIDs")
          .populate({
            path: "entries",
            populate: ["userID", "toUserID"],
          });

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
