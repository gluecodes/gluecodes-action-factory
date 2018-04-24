const BaseError = require('./../base-error');

class UnexpectedResult extends BaseError {
  constructor(props) {
    super(props);
    this.name = 'Remote.UnexpectedResult';
  }
}

module.exports = UnexpectedResult;
