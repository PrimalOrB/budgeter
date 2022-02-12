const { User } = require( '../models' )
const { AuthenticationError } = require( 'apollo-server-express' )
const { signToken } = require( '../utils/auth' )

const resolvers = {
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
      }
    }
}

module.exports = resolvers;
