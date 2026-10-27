const jwt = require('jsonwebtoken');
const { GraphQLError } = require('graphql');
require('dotenv').config()

const secret = process.env.SERVER_SECRET;
const expiration = '12h';

function signToken ( { email, _id } ) {
  const payload = { email, _id };

  return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
}

// resolve the signed-in user ( { email, _id } ) from the request, or null
function getUserFromRequest ( req ) {
  // allows token to be sent via req.body, req.query, or headers
  let token = req.body?.token || req.query?.token || req.headers.authorization;

  if (!token) {
    return null;
  }

  // separate "Bearer" from "<tokenvalue>"
  token = token.split(' ').pop().trim();

  try {
    const { data } = jwt.verify(token, secret, { maxAge: expiration });
    return data;
  } catch {
    return null;
  }
}

function authError ( message = 'Not authenticated' ) {
  return new GraphQLError(message, { extensions: { code: 'UNAUTHENTICATED' } });
}

function forbiddenError ( message = 'Not authorized' ) {
  return new GraphQLError(message, { extensions: { code: 'FORBIDDEN' } });
}

function inputError ( message ) {
  return new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });
}

// throws unless the request carries a valid token
function requireUser ( context ) {
  if (!context.user?._id) {
    throw authError();
  }
  return context.user;
}

module.exports = {
  signToken,
  getUserFromRequest,
  requireUser,
  authError,
  forbiddenError,
  inputError,
};
