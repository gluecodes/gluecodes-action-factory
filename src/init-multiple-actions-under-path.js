const { existsSync, readdirSync } = require('fs');
const { initSingleActionUnderPath } = require('./init-single-action-under-path');

const initMultipleActionsUnderPath = ({
  actionsPath,
  getDirsOfActionsPath = readdirSync,
  importActionFile = require,
}) => {
  const actionDirs = getDirsOfActionsPath(actionsPath);

  let functionsToBeExported = {};

  actionDirs.forEach((actionDir) => {
    const isItActionDirName = ['.', '..'].indexOf(actionDir) === -1;

    if (!isItActionDirName) { return; }

    const actionPath = `${actionsPath}/${actionDir}`;
    const schemasPath = `${actionPath}/schemas`;
    const indexFilePath = `${actionPath}/index.js`;
    const doesSchemasDirExist = existsSync(schemasPath);
    const doesIndexFileExist = existsSync(indexFilePath);
    const isItPackageOfActions = !doesSchemasDirExist && doesIndexFileExist;

    if (isItPackageOfActions) {
      functionsToBeExported = Object.assign(functionsToBeExported, importActionFile(indexFilePath));
      return;
    }

    if (!doesIndexFileExist) { return; }

    const actionFunctions = initSingleActionUnderPath({ actionPath });

    functionsToBeExported = Object.assign(functionsToBeExported, actionFunctions);
  });

  return functionsToBeExported;
};

module.exports = {
  initMultipleActionsUnderPath
};
