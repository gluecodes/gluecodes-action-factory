const BaseError = require('./../base-error');

class InvalidInput extends BaseError {
  constructor(props) {
    super(props);
    this.name = 'Remote.InvalidInput';
  }
}

module.exports = InvalidInput;
