const { User, Budget, Category, Entry } = require( '../models' )
const { AuthenticationError, UserInputError } = require( 'apollo-server-express' )
const { signToken } = require( '../utils/auth' )
const dateScalar = require( './dateScalar' )
const { extractPropAsStrToArr } = require( '../utils/helpers')

const resolvers = {
    Date: dateScalar,

    Query: {
      
    },

    Mutation: {
      login: async( parent, { email }, context ) => {
        if( context.headers.authorization !== undefined ){
          let _id

          // check for user
          const checkUser = await User.findOne( { email: email } )

          // if user, assign _id
          if( checkUser ){
            _id = checkUser._id
          }

          // if no user, create user
          if( !checkUser ){
            const createUser = await User.create( { email } )
            _id = createUser._id
          }

          // once _id verified, sign token
          if( _id ){
            const token = signToken( { email, _id } )
            return { token }
          }

          throw new AuthenticationError('No User Account');

        }
        throw new AuthenticationError('Incorrect credentials');
      },

      createBudget: async( parent, data, context ) => {
        if( context.headers.authorization !== undefined ){
          
          const ownerIDs = []
          const findOwner = await User.findOne( { email: data.input.owner } )
          if( findOwner ){
            ownerIDs.push( findOwner._id )
          }

          for( let i = 0; i < data.input.emails.length; i++ ){
            const findAdditionalOwner = await User.findOne( { email: data.input.emails[i] } )
            if( findAdditionalOwner ){
              ownerIDs.push( findAdditionalOwner._id )
            }
          }

          const newBudget = {
            ownerIDs: [ ...ownerIDs ],
            title: data.input.title,
            desc: data.input.desc
          }

          // create budget
          const createBudget = await Budget.create( { ...newBudget } )

          return createBudget
        }
        throw new AuthenticationError('Incorrect credentials');
      },

      createCategory: async( parent, { input }, context ) => {
        if( context.headers.authorization !== undefined ){

          const { budgetID } = input

          const createBudgetCategory = await Category.create( input )

          const addedToBudget = await Budget.findOneAndUpdate( { _id: budgetID},
            { $push: { categories: createBudgetCategory._id } },
            { new: true, runValidators: true } )      
          
          return addedToBudget
        }
        throw new AuthenticationError('Incorrect credentials');
      },

      updateCategory: async( parent, { input }, context ) => {
        if( context.headers.authorization !== undefined ){
          
          const { categoryID, title, budgetedValueRange } = input

          const updatedCategory = await Category.findOneAndUpdate( { _id: categoryID },
            { title, budgetedValueRange },
            { new: true, runValidators: true } )  

          return updatedCategory
        }
        throw new AuthenticationError('Incorrect credentials');
      },

      createTransaction: async( parent, { input }, context ) => {
        if( context.headers.authorization !== undefined ){

          let { budgetID, categoryID, userID, individualEntry } = input

          individualEntry = individualEntry || false

          const user = await User.findOne( { _id: userID } )

          if( !user ){
            return {}
          }

          const matchCategory = await Category.findOneAndUpdate( 
            { _id: categoryID },
            { $inc: { countUse: 1 } },
            { new: true }
          )

          if( !matchCategory ){
            return {}
          }

          const newEntry = await Entry.create( { ...input, userID: user._id, valueType: matchCategory.categoryType, individualEntry } )

          const budgetUpdate = await Budget.findOneAndUpdate(
            { _id: budgetID },
            { $push: { entries: newEntry._id } },
            { new: true, runValidators: true } ) 

          if( !budgetUpdate ){
            return {}
          }

          return budgetUpdate
        }
        throw new AuthenticationError('Incorrect credentials');
      },

      editTransaction: async( parent, { input }, context ) => {
        if( context.headers.authorization !== undefined ){

          let { entryID, title, value, categoryID, createdAt, userID, individualEntry } = input

          individualEntry = individualEntry || false

          const user = await User.findOne( { _id: userID } )

          if( !user ){
            return {}
          }

          const matchCategory = await Category.findOne( { _id: categoryID } )

          if( !matchCategory ){
            return {}
          }

          const entryUpdate = await Entry.findOneAndUpdate( 
            { _id: entryID },
            { title, value, categoryID, createdAt, userID, individualEntry },
            { new: true, runValidators: true } ) 
            .populate('userID')

          if( !entryUpdate ){
            return {}
          }

          return entryUpdate
        }
        throw new AuthenticationError('Incorrect credentials');
      },

      createTransfer: async( parent, { input }, context ) => {
        if( context.headers.authorization !== undefined ){

          let { budgetID, userID, toUserID } = input

          const user = await User.findOne( { _id: userID } )

          if( !user ){
            return {}
          }

          const userTo = await User.findOne( { _id: toUserID } )

          if( !userTo ){
            return {}
          }

          const newEntry = await Entry.create( { ...input, userID: user._id, valueType: 'transfer', title: `Transfer from ${ user.userInitials } to ${ userTo.userInitials }` } )

          const budgetUpdate = await Budget.findOneAndUpdate(
            { _id: budgetID },
            { $push: { entries: newEntry._id } },
            { new: true, runValidators: true } ) 

          if( !budgetUpdate ){
            return {}
          }

          return budgetUpdate
        }
        throw new AuthenticationError('Incorrect credentials');
      },

      editTransfer: async( parent, { input }, context ) => {
        if( context.headers.authorization !== undefined ){

          let { entryID, value, createdAt, userID, toUserID } = input

          const user = await User.findOne( { _id: userID } )

          if( !user ){
            return {}
          }

          const userTo = await User.findOne( { _id: toUserID } )

          if( !userTo ){
            return {}
          }

          const updateEntry = await Entry.findOneAndUpdate( 
            { _id: entryID },
            { entryID, value, createdAt, userID, toUserID, title: `Transfer from ${ user.userInitials } to ${ userTo.userInitials }` },
            { new: true, runValidators: true } )
            .populate('userID')
            .populate('toUserID')

          if( !updateEntry ){
            return {}
          }

          return updateEntry
        }
        throw new AuthenticationError('Incorrect credentials');
      },

      queryBudget: async( parent, { input }, context ) => {
        if( context.headers.authorization !== undefined ){

          // find budget by ID
          const findBudget = await Budget.findOne( { _id: input.budget } )
            .populate( 'categories' )
            .populate( 'ownerIDs' )
            .populate({
              path: 'entries',
              populate: [ "userID", "toUserID" ]
            })

          if( !findBudget ){
            return {}
          }

          // gather owner IDs
          const owners = extractPropAsStrToArr( findBudget.ownerIDs, '_id' )

          // ensure user is authorized
          const userMatch = owners.includes( input.user )
          if( !userMatch ){
            throw new UserInputError('Incorrect credentials');
          }

          return findBudget
        }
        throw new AuthenticationError('Incorrect credentials');
      },

      queryUserBudgets: async( parent, { input }, context ) => {
        if( context.headers.authorization !== undefined ){

          // find budget with ownerID containing userID
          const findBudgets = await Budget.find( { ownerIDs: { $all: [ input._id ] }  } )
          if( findBudgets.length === 0 ){
            return []
          }

          return findBudgets
        }
        throw new AuthenticationError('Incorrect credentials');
      },

      queryCategory: async( parent, { input }, context ) => {
        if( context.headers.authorization !== undefined ){

          
          const matchCategory = await Category.findOne( { _id: input._id } )
          
          if( !matchCategory ){
            return {}
          }

          return matchCategory
        }
        throw new AuthenticationError('Incorrect credentials');
      },
    }
}

module.exports = resolvers;
