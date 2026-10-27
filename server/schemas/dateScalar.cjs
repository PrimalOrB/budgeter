const { GraphQLScalarType, GraphQLError, Kind } = require('graphql');

// accepts epoch milliseconds or an ISO-8601 string
function toDate(value) {
  const date = new Date(value);
  if (isNaN(date)) {
    throw new GraphQLError(`Invalid Date value: ${value}`, {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
  return date;
}

const dateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type, serialized as epoch milliseconds',
  serialize(value) {
    return value instanceof Date ? value.getTime() : new Date(value).getTime();
  },
  parseValue(value) {
    if (typeof value !== 'number' && typeof value !== 'string') {
      throw new GraphQLError('Date must be a number or string', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    return toDate(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return toDate(parseInt(ast.value, 10));
    }
    if (ast.kind === Kind.STRING) {
      return toDate(ast.value);
    }
    return null;
  },
});

module.exports = dateScalar;
