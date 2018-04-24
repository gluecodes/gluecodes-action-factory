class BaseError extends Error {
  constructor({
    code = null,
    intermediateErrors = [],
    message,
  } = {}) {
    super(message);
    this.code = code;
    this.intermediateErrors = intermediateErrors;
    this.name = 'BaseError';
  }
}

module.exports = BaseError;
