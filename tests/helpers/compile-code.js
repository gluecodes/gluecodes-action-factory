const vm = require('vm');

const compileCode = ({ sourceCode, varsToBeInjected = {} } = {}) => {
  const sandbox = Object.assign({ code: null }, varsToBeInjected);

  vm.createContext(sandbox);
  vm.runInContext(`code = ${sourceCode}`, sandbox);

  return sandbox.code;
};

module.exports = compileCode;
