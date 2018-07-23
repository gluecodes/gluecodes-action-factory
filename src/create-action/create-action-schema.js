const isItBrowserEnv = typeof window !== 'undefined';
const isItWebWorkerEnv = typeof importScripts === 'function';

module.exports = {
  type: 'object',
  properties: {
    bindStepToStepResults: {
      type: 'x-Function'
    },
    dataFlowSchema: {
      type: 'object'
    },
    foldStepResults: {
      type: 'x-Function'
    },
    frontController: {
      type: isItBrowserEnv || isItWebWorkerEnv ? 'x-Function' : 'x-AsyncFunction'
    },
    getConditions: {
      type: 'x-Function'
    },
    getSteps: {
      type: 'x-Function'
    },
    initSchema: {
      type: 'x-Function'
    },
    initialState: {
      type: 'object'
    },
    initValidator: {
      type: 'x-Function'
    },
    onResultChanged: {
      type: 'x-Function'
    }
  },
  required: [
    'bindStepToStepResults',
    'dataFlowSchema',
    'foldStepResults',
    'frontController',
    'getConditions',
    'getSteps',
    'initSchema',
    'initialState',
    'initValidator'
  ]
};
