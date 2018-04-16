const { createAction } = require('./src/create-action');
const { initMultipleActionsUnderPath } = require('./src/init-multiple-actions-under-path');
const { initSingleActionUnderPath } = require('./src/init-single-action-under-path');

module.exports = {
  createAction,
  initMultipleActionsUnderPath,
  initSingleActionUnderPath
};
