const BaseError = require('./../base-error');

class UnspecifiedFailureReason extends BaseError {
  constructor(props) {
    super(props);
    this.name = 'Core.UnspecifiedFailureReason';
  }
}

module.exports = UnspecifiedFailureReason;
