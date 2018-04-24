const BaseError = require('./../base-error');

class InsufficientPermissions extends BaseError {
  constructor(props) {
    super(props);
    this.name = 'Authorization.InsufficientPermissions';
  }
}

module.exports = InsufficientPermissions;
