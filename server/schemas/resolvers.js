const { Quote } = require( '../models' )
const { AuthenticationError } = require( 'apollo-server-express' )
const { signToken } = require( '../utils/auth' )

const resolvers = {
    Query: {
    },

    Mutation: {
      login: async( parent, { email }, context ) => {
        if( context.headers.authorization !== undefined ){
          const token = signToken( email )
          return { token }
        }
        throw new AuthenticationError('Incorrect credentials');
      }
    }
}

module.exports = resolvers;
