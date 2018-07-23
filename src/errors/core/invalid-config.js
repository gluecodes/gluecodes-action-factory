const BaseError = require('./../base-error');

class InvalidConfig extends BaseError {
  constructor(props) {
    super(props);
    this.name = 'Core.InvalidConfig';
  }
}

module.exports = InvalidConfig;
