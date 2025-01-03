const jwt = require('jsonwebtoken');
require('dotenv').config()

const secret = process.env.SERVER_SECRET;
const expiration = '2h';

function signToken ( { email, _id } ) {
  const payload = { email, _id };
  
  return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
}

function authMiddleware ({ req }) {
  // allows token to be sent via req.body, req.query, or headers
  let token = req.body.token || req.query.token || req.headers.authorization;  
  
  // separate "Bearer" from "<tokenvalue>"
  if (req.headers.authorization) {
    token = token
    .split(' ')
    .pop()
    .trim();
  }
   
  // if no token, return request object as is
  if (!token) {
    req.auth = false
    return req;
  }

  try {
    // decode and attach user data to request object
    const { data } = jwt.verify(token, secret, { maxAge: expiration });
    req.user = data;
    // req.auth = true
  } catch {
    console.log('Invalid token');
  }
  
  
  // return updated request object
  return req;
}

module.exports = {
  signToken, authMiddleware
};
