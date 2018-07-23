const address = require('./entities/address.json');

module.exports = {
  type: 'object',
  properties: {
    address,
    email: { type: 'string' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    orderedItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          itemId: { type: 'string' },
          quantity: { type: 'integer' }
        }
      }
    },
    password: { type: 'string' }
  },
  required: [
    'address',
    'email',
    'orderedItems'
  ]
};
