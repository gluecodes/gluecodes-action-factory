const { createAction } = require('./create-action');
const { readdirSync } = require('fs');
const { basename } = require('path');

const initSingleActionUnderPath = ({
  actionPath,
  combineActionSteps = createAction,
  getFilesOfActionPath = readdirSync,
  importActionFile = require
} = {}) => {
  const functionsToBeExported = {};
  const resultChangeHandlers = {};

  const schemasPath = `${actionPath}/schemas`;
  const schemaFiles = getFilesOfActionPath(schemasPath);
  const dashedStringToCamelcase = dashedString => dashedString.replace(/-(\w)/g, g => g[1].toUpperCase());
  const capitalizeString = string => string.replace(/^\w/, g => g[0].toUpperCase());
  const actionDir = basename(actionPath);
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

  return functionsToBeExported;
};

module.exports = {
  initSingleActionUnderPath
};
