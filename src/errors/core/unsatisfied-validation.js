const BaseError = require('./../base-error');

class UnsatisfiedValidation extends BaseError {
  constructor(props) {
    super(props);
    this.name = 'Core.UnsatisfiedValidation';
  }
}

module.exports = UnsatisfiedValidation;
