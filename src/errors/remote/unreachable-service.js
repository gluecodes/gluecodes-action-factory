const BaseError = require('./../base-error');

class UnreachableService extends BaseError {
  constructor(props) {
    super(props);
    this.name = 'Remote.UnreachableService';
  }
}

module.exports = UnreachableService;
