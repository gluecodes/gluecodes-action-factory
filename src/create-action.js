const Ajv = require('ajv');
const inputSchema = require('./create-action.json');

const _bindStepToStepResults = ({
  step: { // can contain: name, code, isItAsync, settings
    name,
    code,
    isItAsync
  },
  storeStepResult
} = {}) => {
  if (isItAsync) {
    return async (props) => {
      const stepResult = await code(props);

      storeStepResult({ stepName: name, stepResult });
    };
  }

  return (props) => {
    const stepResult = code(props);

    storeStepResult({ stepName: name, stepResult });
  };
};

const _transformSchemaRecursively = ({
  schema,
  importCustomValidatorHandler = require
} = {}) => {
  if (schema.type !== 'object' || !schema.properties) { return; }

  Object.keys(schema.properties).forEach((propName) => {
    const propSettings = schema.properties[propName];
    const isPropOfExtendedType = /^x-/.test(propSettings.type);

    if (propSettings.type === 'object' && typeof propSettings.default !== 'undefined') {
      throw new Error([
        "Property of type 'object' must not have 'default' value, ",
        "instead specify its properties and set 'default' values on them"
      ].join(''));
    }

    if (propSettings.validator) {
      propSettings.validator.handler = importCustomValidatorHandler(propSettings.validator.handler);
    }

    if (isPropOfExtendedType) {
      const [, extendedType] = propSettings.type.split('x-');

      propSettings.extendedType = extendedType;

      delete propSettings.type;
      return;
    }

    if (propSettings.type !== 'object') { return; }

    _transformSchemaRecursively({ schema: propSettings, importCustomValidatorHandler });
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

  ajv.addKeyword('extendedType', {
    validate: (extendedType, value) => {
      if (value === null
        || (value && value.constructor.name === extendedType)) { return true; }

      const error = {
        name: 'UnsatisfiedValidation',
        message: `Value: '${value}' is not an instance of '${extendedType}'`,
        intermediateErrors: []
      };

      throw error;
    }
  });

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
  getConditions,
  getSteps,
  importCustomValidatorHandler = require,
  initSchema = _initSchema,
  initialState = {},
  initValidator = _initValidator,
  onResultChanged
} = {}) => {
  const validateInput = initValidator({
    schema: initSchema({
      schema: { setInput: inputSchema },
      importCustomValidatorHandler
    })
  });

  validateInput({
    data: {
      setInput: {
        bindStepToStepResults,
        dataFlowSchema,
        foldStepResults,
        frontController,
        getConditions,
        getSteps,
        importCustomValidatorHandler,
        initSchema,
        initialState,
        initValidator,
        onResultChanged
      }
    }
  });

  const dataReceivers = [];
  const schema = initSchema({ schema: dataFlowSchema, importCustomValidatorHandler });
  const validateStepResults = initValidator({ schema });
  const stepResults = {};

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
  const conditions = getConditions({ stepResults });

  if (typeof steps.setInput === 'function') {
    throw new Error("'setInput' step name is reserved for a step representing action input");
  }

  if (typeof steps.getResult === 'function') {
    throw new Error("getInput' step name is reserved for a step representing action result");
  }

  Object.keys(conditions).forEach((conditionName) => {
    const condition = conditions[conditionName];

    if (typeof condition !== 'function') {
      throw new Error([
        'Invalid Conditions provider, ',
        "arg: 'getConditions' must be a function returning a literal object of functions. ",
        `Condition: '${conditionName} is not a function'`
      ].split(''));
    }
  });

  Object.keys(steps).forEach((stepName) => {
    const isSchemaMissingForGivenStep = !dataFlowSchema[stepName];

    if (isSchemaMissingForGivenStep) {
      throw new Error(`Missing schema for step: '${stepName}'`);
    }

    const step = typeof steps[stepName] === 'function'
      ? { name: stepName, code: steps[stepName] }
      : steps[stepName];

    if (typeof step.code !== 'function') {
      throw new Error([
        'Invalid Steps provider, ',
        "arg: 'getSteps' must be a function returning a literal object of functions. ",
        `Step: '${stepName} is not a function'`
      ].split(''));
    }

    step.isItAsync = step.code.constructor.name === 'AsyncFunction';
    steps[stepName] = bindStepToStepResults({ step, storeStepResult });
  });

  return async (props = {}) => {
    Object.assign(stepResults, _initState({ schema, state: {} }), initialState);

    _mergeStepResultRecursively({
      schema,
      state: stepResults,
      stepName: 'setInput',
      value: props
    });

    validateStepResults({ data: stepResults });

    await frontController({
      conditions,
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
