const BaseError = require('./../base-error');

class IncorrectCredentials extends BaseError {
  constructor(props) {
    super(props);
    this.name = 'Authentication.IncorrectCredentials';
  }
}

module.exports = IncorrectCredentials;
