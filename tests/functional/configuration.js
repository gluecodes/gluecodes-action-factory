const { expect } = require('chai');
const { createAction } = require('./../../index');
const compileCode = require('./../helpers/compile-code');
const errorCodes = require('./../../src/create-action/error-codes.json');

const test = it.bind(it);

describe('configuration', () => {
  const inputArgs = {
    bindStepToStepResults: {
      type: 'x-Function',
      isRequired: false,
      wrongTypeExample: []
    },
    dataFlowSchema: {
      type: 'object',
      isRequired: true,
      wrongTypeExample: true
    },
    foldStepResults: {
      type: 'x-Function',
      isRequired: true,
      wrongTypeExample: 10
    },
    frontController: {
      type: 'x-AsyncFunction',
      isRequired: true,
      wrongTypeExample: -10
    },
    getConditions: {
      type: 'x-Function',
      isRequired: true,
      wrongTypeExample: 0.01
    },
    getSteps: {
      type: 'x-Function',
      isRequired: true,
      wrongTypeExample: -0.01
    },
    importCustomValidatorHandler: {
      type: 'x-Function',
      isRequired: false,
      wrongTypeExample: {}
    },
    initSchema: {
      type: 'x-Function',
      isRequired: false,
      wrongTypeExample: 'some string'
    },
    initialState: {
      type: 'object',
      isRequired: false,
      wrongTypeExample: null
    },
    initValidator: {
      type: 'x-Function',
      isRequired: false,
      wrongTypeExample: new Date()
    },
    onResultChanged: {
      type: 'x-Function',
      isRequired: false,
      wrongTypeExample: new RegExp('^.+$')
    }
  };

  test('passing all correct required arguments', () => {
    const steps = `
      () => ({
        async step1() {},
        async step2() {},
        step3() { }
      });
    `;
    const conditions = `
      () => ({
        condition1() {},
        condition2() {},
        condition3() {}
      });
    `;
    const dataFlowSchema = {
      setInput: {},
      step1: {},
      step2: {},
      step3: {},
      getResult: {}
    };
    const foldStepResults = `
      () => {};
    `;
    const frontController = `
      async ({} = {}) => {}
    `;

    try {
      createAction({
        dataFlowSchema,
        foldStepResults: compileCode({ sourceCode: foldStepResults }),
        frontController: compileCode({ sourceCode: frontController }),
        getSteps: compileCode({ sourceCode: steps }),
        getConditions: compileCode({ sourceCode: conditions })
      });
    } catch (err) {
      throw err;
    }

    expect(true).to.equal(true);
  });

  Object.keys(inputArgs).forEach((argName) => {
    const argSettings = inputArgs[argName];

    if (!argSettings.isRequired) { return; }

    test(`missing required argument: '${argName}'`, (done) => {
      const steps = `
        () => ({
          async step1() {},
          async step2() {},
          step3() { }
        });
      `;
      const conditions = `
        () => ({
          condition1() {},
          condition2() {},
          condition3() {}
        });
      `;
      const dataFlowSchema = {
        setInput: {},
        step1: {},
        step2: {},
        step3: {},
        getResult: {}
      };
      const foldStepResults = `
        () => {};
      `;
      const frontController = `
        async ({} = {}) => {}
      `;

      try {
        createAction({
          dataFlowSchema: argName === 'dataFlowSchema' ? undefined : dataFlowSchema,
          foldStepResults: argName === 'foldStepResults' ? undefined : compileCode({ sourceCode: foldStepResults }),
          frontController: argName === 'frontController' ? undefined : compileCode({ sourceCode: frontController }),
          getSteps: argName === 'getSteps' ? undefined : compileCode({ sourceCode: steps }),
          getConditions: argName === 'getConditions' ? undefined : compileCode({ sourceCode: conditions })
        });

        done(new Error(`Uncaught missed required arg: ${argName}`));
      } catch (expectedError) {
        expect(expectedError.name).to.equal('Core.UnsatisfiedValidation');
        expect(expectedError).to.nested.include({ 'intermediateErrors[0].keyword': 'required' });
        expect(expectedError).to.nested.include({ 'intermediateErrors[0].params.missingProperty': argName });
        done();
      }
    });
  });

  Object.keys(inputArgs).forEach((argName) => {
    const argSettings = inputArgs[argName];

    test(`invalid type of argument: '${argName}'`, (done) => {
      const steps = `
        () => ({
          async step1() {},
          async step2() {},
          step3() { }
        });
      `;
      const conditions = `
        () => ({
          condition1() {},
          condition2() {},
          condition3() {}
        });
      `;
      const dataFlowSchema = {
        setInput: {},
        step1: {},
        step2: {},
        step3: {},
        getResult: {}
      };
      const foldStepResults = `
        () => {};
      `;
      const frontController = `
        async ({} = {}) => {}
      `;

      try {
        createAction({
          bindStepToStepResults: argName === 'bindStepToStepResults'
            ? argSettings.wrongTypeExample
            : undefined,
          dataFlowSchema: argName === 'dataFlowSchema'
            ? argSettings.wrongTypeExample
            : dataFlowSchema,
          foldStepResults: argName === 'foldStepResults'
            ? argSettings.wrongTypeExample
            : compileCode({ sourceCode: foldStepResults }),
          frontController: argName === 'frontController'
            ? argSettings.wrongTypeExample
            : compileCode({ sourceCode: frontController }),
          importCustomValidatorHandler: argName === 'importCustomValidatorHandler'
            ? argSettings.wrongTypeExample
            : require,
          initialState: argName === 'initialState'
            ? argSettings.wrongTypeExample
            : undefined,
          initSchema: argName === 'initSchema'
            ? argSettings.wrongTypeExample
            : undefined,
          initValidator: argName === 'initValidator'
            ? argSettings.wrongTypeExample
            : undefined,
          getSteps: argName === 'getSteps'
            ? argSettings.wrongTypeExample
            : compileCode({ sourceCode: steps }),
          getConditions: argName === 'getConditions'
            ? argSettings.wrongTypeExample
            : compileCode({ sourceCode: conditions }),
          onResultChanged: argName === 'onResultChanged'
            ? argSettings.wrongTypeExample
            : () => {}
        });

        done(new Error(`Uncaught wrong type of arg: ${argName}`));
      } catch (expectedError) {
        expect(expectedError.name).to.equal('Core.UnsatisfiedValidation');
        expect(expectedError).to.nested.include({ 'intermediateErrors[0].keyword': 'type' });
        expect(expectedError).to.nested.include({ 'intermediateErrors[0].params.type': argSettings.type });
        expect(expectedError).to.nested.include({ 'intermediateErrors[0].dataPath': `.setInput.${argName}` });
        done();
      }
    });
  });

  test(`throwing ${errorCodes.ILLEGAL_GET_RESULT_STEP_NAME}`, (done) => {
    const steps = `
      () => ({
        async step1() {},
        async step2() {},
        getResult() { }
      });
    `;
    const conditions = `
      () => ({
        condition1() {},
        condition2() {},
        condition3() {}
      });
    `;
    const dataFlowSchema = {
      setInput: {},
      step1: {},
      step2: {},
      getResult: {}
    };
    const foldStepResults = `
      () => {};
    `;
    const frontController = `
      async ({} = {}) => {}
    `;

    try {
      createAction({
        dataFlowSchema,
        foldStepResults: compileCode({ sourceCode: foldStepResults }),
        frontController: compileCode({ sourceCode: frontController }),
        getSteps: compileCode({ sourceCode: steps }),
        getConditions: compileCode({ sourceCode: conditions })
      });

      done(new Error(`Uncaught error: ${errorCodes.ILLEGAL_GET_RESULT_STEP_NAME}`));
    } catch (expectedError) {
      expect(expectedError.name).to.equal('Core.InvalidConfig');
      expect(expectedError.code).to.equal(errorCodes.ILLEGAL_GET_RESULT_STEP_NAME);
      done();
    }
  });

  test(`throwing ${errorCodes.ILLEGAL_SET_INPUT_STEP_NAME}`, (done) => {
    const steps = `
      () => ({
        async step1() {},
        async step2() {},
        setInput() { }
      });
    `;
    const conditions = `
      () => ({
        condition1() {},
        condition2() {},
        condition3() {}
      });
    `;
    const dataFlowSchema = {
      setInput: {},
      step1: {},
      step2: {},
      getResult: {}
    };
    const foldStepResults = `
      () => {};
    `;
    const frontController = `
      async ({} = {}) => {}
    `;

    try {
      createAction({
        dataFlowSchema,
        foldStepResults: compileCode({ sourceCode: foldStepResults }),
        frontController: compileCode({ sourceCode: frontController }),
        getSteps: compileCode({ sourceCode: steps }),
        getConditions: compileCode({ sourceCode: conditions })
      });

      done(new Error(`Uncaught error: ${errorCodes.ILLEGAL_SET_INPUT_STEP_NAME}`));
    } catch (expectedError) {
      expect(expectedError.name).to.equal('Core.InvalidConfig');
      expect(expectedError.code).to.equal(errorCodes.ILLEGAL_SET_INPUT_STEP_NAME);
      done();
    }
  });

  test(`throwing ${errorCodes.INVALID_CONDITIONS_PROVIDER}`, (done) => {
    const steps = `
      () => ({
        async step1() {},
        async step2() {},
        step3() { }
      });
    `;
    const conditions = `
      () => ({
        condition1() {},
        condition2() {},
        condition3: 'some non-function'
      });
    `;
    const dataFlowSchema = {
      setInput: {},
      step1: {},
      step2: {},
      step3: {},
      getResult: {}
    };
    const foldStepResults = `
      () => {};
    `;
    const frontController = `
      async ({} = {}) => {}
    `;

    try {
      createAction({
        dataFlowSchema,
        foldStepResults: compileCode({ sourceCode: foldStepResults }),
        frontController: compileCode({ sourceCode: frontController }),
        getSteps: compileCode({ sourceCode: steps }),
        getConditions: compileCode({ sourceCode: conditions })
      });

      done(new Error(`Uncaught error: ${errorCodes.INVALID_CONDITIONS_PROVIDER}`));
    } catch (expectedError) {
      expect(expectedError.name).to.equal('Core.InvalidConfig');
      expect(expectedError.code).to.equal(errorCodes.INVALID_CONDITIONS_PROVIDER);
      done();
    }
  });

  test(`throwing ${errorCodes.INVALID_STEPS_PROVIDER}`, (done) => {
    const steps = `
      () => ({
        step1: 'some non-function',
        async step2() {},
        step3() { }
      });
    `;
    const conditions = `
      () => ({
        condition1() {},
        condition2() {},
        condition3() {}
      });
    `;
    const dataFlowSchema = {
      setInput: {},
      step1: {},
      step2: {},
      step3: {},
      getResult: {}
    };
    const foldStepResults = `
      () => {};
    `;
    const frontController = `
      async ({} = {}) => {}
    `;

    try {
      createAction({
        dataFlowSchema,
        foldStepResults: compileCode({ sourceCode: foldStepResults }),
        frontController: compileCode({ sourceCode: frontController }),
        getSteps: compileCode({ sourceCode: steps }),
        getConditions: compileCode({ sourceCode: conditions })
      });

      done(new Error(`Uncaught error: ${errorCodes.INVALID_STEPS_PROVIDER}`));
    } catch (expectedError) {
      expect(expectedError.name).to.equal('Core.InvalidConfig');
      expect(expectedError.code).to.equal(errorCodes.INVALID_STEPS_PROVIDER);
      done();
    }
  });

  test(`throwing ${errorCodes.MISSING_SCHEMA_FOR_GIVEN_STEP}`, (done) => {
    const steps = `
      () => ({
        async step1() {},
        async step2() {},
        step3() { }
      });
    `;
    const conditions = `
      () => ({
        condition1() {},
        condition2() {},
        condition3() {}
      });
    `;
    const dataFlowSchema = { // no schema for step1
      setInput: {},
      step2: {},
      step3: {},
      getResult: {}
    };
    const foldStepResults = `
      () => {};
    `;
    const frontController = `
      async ({} = {}) => {}
    `;

    try {
      createAction({
        dataFlowSchema,
        foldStepResults: compileCode({ sourceCode: foldStepResults }),
        frontController: compileCode({ sourceCode: frontController }),
        getSteps: compileCode({ sourceCode: steps }),
        getConditions: compileCode({ sourceCode: conditions })
      });

      done(new Error(`Uncaught error: ${errorCodes.MISSING_SCHEMA_FOR_GIVEN_STEP}`));
    } catch (expectedError) {
      expect(expectedError.name).to.equal('Core.InvalidConfig');
      expect(expectedError.code).to.equal(errorCodes.MISSING_SCHEMA_FOR_GIVEN_STEP);
      done();
    }
  });

  test(`throwing ${errorCodes.NO_DEFAULT_OBJECTS}`, (done) => {
    const steps = `
      () => ({
        async step1() {},
        async step2() {},
        step3() { }
      });
    `;
    const conditions = `
      () => ({
        condition1() {},
        condition2() {},
        condition3() {}
      });
    `;
    const dataFlowSchema = {
      setInput: {
        type: 'object',
        properties: {
          someProp: {
            type: 'object',
            default: {
              someNestedProp: 'someNestedProp'
            }
          }
        }
      },
      step1: {},
      step2: {},
      step3: {},
      getResult: {}
    };
    const foldStepResults = `
      () => {};
    `;
    const frontController = `
      async ({} = {}) => {}
    `;

    try {
      createAction({
        dataFlowSchema,
        foldStepResults: compileCode({ sourceCode: foldStepResults }),
        frontController: compileCode({ sourceCode: frontController }),
        getSteps: compileCode({ sourceCode: steps }),
        getConditions: compileCode({ sourceCode: conditions })
      });

      done(new Error(`Uncaught error: ${errorCodes.NO_DEFAULT_OBJECTS}`));
    } catch (expectedError) {
      expect(expectedError.name).to.equal('Core.InvalidConfig');
      expect(expectedError.code).to.equal(errorCodes.NO_DEFAULT_OBJECTS);
      done();
    }
  });

  test(`throwing ${errorCodes.NO_DEFAULT_VALUE_ON_REQUIRED_PROP}`, (done) => {
    const steps = `
      () => ({
        async step1() {},
        async step2() {},
        step3() { }
      });
    `;
    const conditions = `
      () => ({
        condition1() {},
        condition2() {},
        condition3() {}
      });
    `;
    const dataFlowSchema = {
      setInput: {
        type: 'object',
        properties: {
          someProp: {
            type: 'string',
            default: 'some string'
          }
        },
        required: ['someProp']
      },
      step1: {},
      step2: {},
      step3: {},
      getResult: {}
    };
    const foldStepResults = `
      () => {};
    `;
    const frontController = `
      async ({} = {}) => {}
    `;

    try {
      createAction({
        dataFlowSchema,
        foldStepResults: compileCode({ sourceCode: foldStepResults }),
        frontController: compileCode({ sourceCode: frontController }),
        getSteps: compileCode({ sourceCode: steps }),
        getConditions: compileCode({ sourceCode: conditions })
      });

      done(new Error(`Uncaught error: ${errorCodes.NO_DEFAULT_VALUE_ON_REQUIRED_PROP}`));
    } catch (expectedError) {
      expect(expectedError.name).to.equal('Core.InvalidConfig');
      expect(expectedError.code).to.equal(errorCodes.NO_DEFAULT_VALUE_ON_REQUIRED_PROP);
      done();
    }
  });
});
