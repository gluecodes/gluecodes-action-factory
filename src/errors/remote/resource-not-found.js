const BaseError = require('./../base-error');

class ResourceNotFound extends BaseError {
  constructor(props) {
    super(props);
    this.name = 'Remote.ResourceNotFound';
  }
}

module.exports = ResourceNotFound;
