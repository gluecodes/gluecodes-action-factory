const { expect } = require('chai');
const { createAction } = require('./../../index');
const compileCode = require('./../helpers/compile-code');

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
});
