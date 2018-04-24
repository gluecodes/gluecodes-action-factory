const IncorrectCredentials = require('./authentication/incorrect-credentials');
const InsufficientPermissions = require('./authorization/insufficient-permissions');
const ExceededExecutionTimeout = require('./core/exceeded-execution-timeout');
const InvalidConfig = require('./core/invalid-config');
const MissingConfig = require('./core/missing-config');
const UnsatisfiedValidation = require('./core/unsatisfied-validation');
const UnspecifiedFailureReason = require('./core/unspecified-failure-reason');
const InvalidInput = require('./remote/invalid-input');
const ResourceNotFound = require('./remote/resource-not-found');
const UnexpectedResult = require('./remote/unexpected-result');
const UnreachableService = require('./remote/unreachable-service');

module.exports = {
  authentication: {
    IncorrectCredentials
  },
  authorization: {
    InsufficientPermissions
  },
  core: {
    ExceededExecutionTimeout,
    InvalidConfig,
    MissingConfig,
    UnsatisfiedValidation,
    UnspecifiedFailureReason
  },
  remote: {
    InvalidInput,
    ResourceNotFound,
    UnexpectedResult,
    UnreachableService
  }
};
