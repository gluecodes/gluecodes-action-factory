const BaseError = require('./../base-error');

class MissingConfig extends BaseError {
  constructor(props) {
    super(props);
    this.name = 'Core.MissingConfig';
  }
}

module.exports = MissingConfig;
