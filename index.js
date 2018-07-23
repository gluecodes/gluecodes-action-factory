const { createAction } = require('./src/create-action/create-action');
const errors = require('./src/errors/index');
const { initMultipleActionsUnderPath } = require('./src/init-multiple-actions-under-path');
const { initSingleActionUnderPath } = require('./src/init-single-action-under-path');

module.exports = {
  createAction,
  errors,
  initMultipleActionsUnderPath,
  initSingleActionUnderPath
};
