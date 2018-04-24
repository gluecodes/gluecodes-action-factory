const BaseError = require('./../base-error');

class ExceededExecutionTimeout extends BaseError {
  constructor(props) {
    super(props);
    this.name = 'Core.ExceededExecutionTimeout';
  }
}

module.exports = ExceededExecutionTimeout;
