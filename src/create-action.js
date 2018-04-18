const Ajv = require('ajv');

const _bindStepToStepResults = ({
  step: { // can contain: name, code, isItAsync, settings
    name,
    code,
    isItAsync
  },
  storeStepResult
} = {}) => async function boundStep(props) {
  const stepResult = isItAsync ? await code(props) : code(props);

  storeStepResult({ stepName: name, stepResult });
};

const _transformSchemaRecursively = ({
  schema,
  importCustomValidatorHandler = require
} = {}) => {
  if (schema.type !== 'object' || !schema.properties) { return; }

  Object.keys(schema.properties).forEach((propName) => {
    const propDefinition = schema.properties[propName];

    if (propDefinition.validator) {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      propDefinition.validator.handler = importCustomValidatorHandler(propDefinition.validator.handler);
    }

    if (propDefinition.type !== 'object') { return; }

    _transformSchemaRecursively({ schema: propDefinition, importCustomValidatorHandler });
  });
};

const _initSchema = ({
  schema,
  importCustomValidatorHandler = require
} = {}) => {
  const schemaToBeReturned = {
    type: 'object',
    properties: schema
  };

  _transformSchemaRecursively({ schema: schemaToBeReturned, importCustomValidatorHandler });

  return schemaToBeReturned;
};

const _transformStateRecursively = ({
  schema,
  state
} = {}) => {
  if (schema.type !== 'object') { return; }

  schema.properties = schema.properties || {};

  Object.keys(schema.properties).forEach((propName) => {
    const propSettings = schema.properties[propName];

    if (propSettings.type !== 'object') {
      state[propName] = typeof propSettings.default !== 'undefined' ? propSettings.default : null;

      if (propSettings.type === 'boolean') {
        state[propName] = !!state[propName];
        return;
      }

      if (propSettings.type === 'number' || propSettings.type === 'integer') {
        state[propName] = +state[propName];
        return;
      }

      if (propSettings.type === 'string') {
        state[propName] = state[propName] === null ? '' : `${state[propName]}`;
        return;
      }

      if (propSettings.type === 'array') {
        state[propName] = Array.isArray(state[propName]) ? state[propName] : [];
      }

      return;
    }

    state[propName] = {};

    _transformStateRecursively({
      schema: propSettings,
      state: state[propName]
    });
  });
};

const _initState = ({
  schema
} = {}) => {
  const stateToBeReturned = {
    setInput: {},
    getResult: {}
  };

  _transformStateRecursively({
    schema,
    state: stateToBeReturned
  });

  return stateToBeReturned;
};

const _initValidator = ({ schema } = {}) => { // @todo prepare common error creators
  const ajv = new Ajv({ allErrors: true });

  ajv.addKeyword('validator', {
    validate: (definition, value) => {
      const {
        handler,
        settings,
        settings: {
          message
        }
      } = definition;
      const intermediateErrors = [];

      try {
        const isValueValid = handler({ value, settings });

        if (isValueValid) { return true; }

      } catch (err) {
        intermediateErrors.push(err);
      }

      const error = {
        name: 'UnsatisfiedValidation',
        message,
        intermediateErrors
      };

      throw error;
    }
  });

  const validator = ajv.compile(schema);

  return ({ data } = {}) => {
    if (validator(data)) { return; }

    const error = {
      name: 'UnsatisfiedValidation',
      message: 'Validation error',
      intermediateErrors: validator.errors
    };

    throw error;
  };
};

const _mergeStepResultRecursively = ({
  schema,
  state,
  stepName,
  value
} = {}) => {
  if (schema.type !== 'object') { return; }

  const isItNestedObjectIteration = !stepName;

  const propsToIterateThrough = !isItNestedObjectIteration
    ? { [stepName]: schema.properties[stepName] }
    : schema.properties;

  Object.keys(propsToIterateThrough).forEach((propName) => {
    const propSettings = propsToIterateThrough[propName];
    const valueToBeSet = isItNestedObjectIteration ? value[propName] : value;

    if (propSettings.type !== 'object') {
      state[propName] = valueToBeSet !== null ? valueToBeSet : (propSettings.default || null);

      const isItValueResetAttempt = state[propName] === null;

      if (isItValueResetAttempt && propSettings.type === 'boolean') {
        state[propName] = !!state[propName];
        return;
      }

      if (isItValueResetAttempt && (propSettings.type === 'number' || propSettings.type === 'integer')) {
        state[propName] = +state[propName];
        return;
      }

      if (isItValueResetAttempt && propSettings.type === 'string') {
        state[propName] = '';
        return;
      }

      if (isItValueResetAttempt && propSettings.type === 'array') {
        state[propName] = [];
      }

      return;
    }

    const isValueLiteralObject = valueToBeSet instanceof Object && valueToBeSet.constructor.name === 'Object';
    const hasNestedObjectNoPropsDefined = Object.keys(propSettings.properties).length === 0;

    if (!isValueLiteralObject || hasNestedObjectNoPropsDefined) {
      state[propName] = valueToBeSet; // we let setting a non-object when object expected to make validation fail ASAP
      return;
    }

    _mergeStepResultRecursively({
      schema: propSettings,
      state: state[propName],
      value: valueToBeSet
    });
  });
};

const createAction = ({
  bindStepToStepResults = _bindStepToStepResults,
  dataFlowSchema,
  foldStepResults,
  frontController,
  getSteps,
  getConditions,
  importCustomValidatorHandler = require,
  initSchema = _initSchema,
  initialState = {},
  initValidator = _initValidator,
  onResultChanged
} = {}) => {
  const dataReceivers = [];
  const schema = initSchema({ schema: dataFlowSchema, importCustomValidatorHandler });
  const validateStepResults = initValidator({ schema });
  const stepResults = Object.assign(_initState({ schema, state: {} }), initialState);

  const openDataReceiver = (registerDataReceiver) => {
    const dataReceiver = {};
    const sendReceivedData = ({ data } = {}) => {
      const { stepName } = dataReceiver;

      _mergeStepResultRecursively({
        schema,
        state: stepResults,
        stepName,
        value: data
      });

      const result = foldStepResults({ stepResults });

      _mergeStepResultRecursively({
        schema,
        state: stepResults,
        stepName: 'getResult',
        value: result
      });

      validateStepResults({ data: stepResults });
      onResultChanged({ result, triggeredBy: stepName });
    };

    registerDataReceiver({ sendData: sendReceivedData });
    dataReceivers.push(dataReceiver);
    return dataReceiver;
  };

  const storeStepResult = ({
    stepName,
    stepResult
  } = {}) => {
    const potentialDataReceiverIndex = dataReceivers.indexOf(stepResult);
    const isStepResultDataReceiver = potentialDataReceiverIndex !== -1;

    if (!isStepResultDataReceiver) {
      _mergeStepResultRecursively({
        schema,
        state: stepResults,
        stepName,
        value: stepResult
      });

      validateStepResults({ data: stepResults });
      return;
    }

    const dataReceiver = dataReceivers[potentialDataReceiverIndex];
    const associateDataReceiverWithItsStep = () => { dataReceiver.stepName = stepName; };

    associateDataReceiverWithItsStep();
  };

  const steps = getSteps({ stepResults, openDataReceiver });

  Object.keys(steps).forEach((stepName) => {
    const step = typeof steps[stepName] === 'function'
      ? { name: stepName, code: steps[stepName] }
      : steps[stepName];

    step.isItAsync = step.code.constructor.name === 'AsyncFunction';
    steps[stepName] = bindStepToStepResults({ step, storeStepResult });
  });

  return async function resultedStep(props = {}) {
    _mergeStepResultRecursively({
      schema,
      state: stepResults,
      stepName: 'setInput',
      value: props
    });

    validateStepResults({ data: stepResults });

    await frontController({
      conditions: getConditions({ stepResults }),
      steps
    });

    const result = foldStepResults({ stepResults });

    _mergeStepResultRecursively({
      schema,
      state: stepResults,
      stepName: 'getResult',
      value: result
    });

    validateStepResults({ data: stepResults });
    return result;
  };
};

module.exports = {
  createAction,
  _bindStepToStepResults,
  _initSchema,
  _initState,
  _initValidator,
  _mergeStepResultRecursively,
  _transformSchemaRecursively,
  _transformStateRecursively
};
