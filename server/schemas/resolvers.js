const { User, Budget, Category, Entry } = require( '../models' )
const { AuthenticationError, UserInputError } = require( 'apollo-server-express' )
const { signToken } = require( '../utils/auth' )
const dateScalar = require( './dateScalar' )

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

      createTransaction: async( parent, { input }, context ) => {
        if( context.headers.authorization !== undefined ){

          let { budgetID, categoryID } = input

          const user = await User.findOne( { email: context.user.email } )

          if( !user ){
            throw new UserInputError('No User Found');
          }

          const matchCategory = await Category.findOne( { _id: categoryID } )

          if( !matchCategory ){
            throw new UserInputError('Category Not Found');
          }

          const newEntry = await Entry.create( { ...input, userId: user._id, valueType: matchCategory.categoryType } )

          const budgetUpdate = await Budget.findOneAndUpdate(
            { _id: budgetID },
            { $push: { entries: newEntry._id } },
            { new: true, runValidators: true } ) 

          if( !budgetUpdate ){
            throw new UserInputError('Budget Not Found');
          }

          return budgetUpdate
        }
        throw new AuthenticationError('Incorrect credentials');
      },

      queryBudget: async( parent, { input }, context ) => {
        if( context.headers.authorization !== undefined ){

          // find budget by ID
          const findBudget = await Budget.findOne( { _id: input.budget } )
            .populate( 'categories' )
            .populate( 'entries' )

          if( !findBudget ){
            throw new UserInputError('No Data Returned')
          }
          // ensure user is authorized
          const userMatch = findBudget.ownerIDs.includes( input.user )
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
            throw new UserInputError('No Data Returned')
          }

          return findBudgets
        }
        throw new AuthenticationError('Incorrect credentials');
      },
    }
}

module.exports = resolvers;
