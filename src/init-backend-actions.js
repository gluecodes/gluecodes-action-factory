const { createAction } = require('./create-action');
const { existsSync, readdirSync } = require('fs');

const initBackendActions = ({
  combineActionSteps = createAction,
  getDirsOfActionsPath = readdirSync,
  getFilesOfActionPath = readdirSync,
  importActionFile = require,
  actionsPath
} = {}) => {
  const actionDirs = getDirsOfActionsPath(actionsPath);
  const functionsToBeExported = {};
  const resultChangeHandlers = {};

  actionDirs.forEach((actionDir) => {
    const isItActionDirName = ['.', '..'].indexOf(actionDir) === -1;

    if (!isItActionDirName) { return; }

    const actionPath = `${actionsPath}/${actionDir}`;
    const schemasPath = `${actionPath}/schemas`;
    const doesSchemasDirExist = existsSync(schemasPath);

    if (!doesSchemasDirExist) { return; }

    const schemaFiles = getFilesOfActionPath(schemasPath);
    const dashedStringToCamelcase = dashedString => dashedString.replace(/-(\w)/g, g => g[1].toUpperCase());
    const capitalizeString = string => string.replace(/^\w/, g => g[0].toUpperCase());
    const actionName = dashedStringToCamelcase(actionDir);
    const dataFlowSchema = {};

    const resultChangeEventName = `on${capitalizeString(actionName)}ResultChanged`;

    schemaFiles.forEach((schemaFilename) => {
      const stepNameMatch = /^[^.]+/.exec(schemaFilename);
      const stepName = dashedStringToCamelcase(stepNameMatch[0]);

      dataFlowSchema[stepName] = importActionFile(`${schemasPath}/${schemaFilename}`);
    });

    functionsToBeExported[resultChangeEventName] = (handler) => {
      resultChangeHandlers[actionName] = handler;
    };

    functionsToBeExported[actionName] = combineActionSteps({
      dataFlowSchema,
      foldStepResults: importActionFile(`${actionPath}/fold-step-results.js`),
      frontController: importActionFile(`${actionPath}/index.js`),
      getSteps: importActionFile(`${actionPath}/steps.js`),
      getConditions: importActionFile(`${actionPath}/conditions.js`),
      onResultChanged: (...args) => {
        if (typeof resultChangeHandlers[actionName] !== 'function') { return; }

        resultChangeHandlers[actionName](...args);
      }
    });
  });

  return functionsToBeExported;
};

module.exports = {
  initBackendActions
};
