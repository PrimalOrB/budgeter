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
  parseMonthlyEntries,
  parseMonthlyBalances,
} = require("../utils/helpers.cjs");
const build_PDF_MonthlyReport = require("../utils/build_PDF_monthlyReport.cjs")

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

        createdMonth.entires = [...monthlyEntries];

        // Populate entries
        const populatedMonth = parseMonthlyEntries(createdMonth);

        // Balancing Calculations
        const balancedMonth = parseMonthlyBalances(populatedMonth);

        findBudget.months = [balancedMonth];

        const report = await build_PDF_MonthlyReport(findBudget) 

        let bufferStr = Buffer.from(report, "utf8");
        
        const base64 = bufferStr.toString("base64");

        return { blob: base64 };
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
        newMonths
          .sort((a, b) => a.order - b.order)
          .map((month) => {
            return populatedMonths.push(parseMonthlyEntries(month));
          });

        // Balancing Calculations
        populatedMonths.map((month) => {
          return parseMonthlyBalances(month);
        });

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
