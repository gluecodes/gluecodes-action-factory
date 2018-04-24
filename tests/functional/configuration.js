const { expect } = require('chai');
const { createAction } = require('./../../index');
const compileCode = require('./../helpers/compile-code');

const test = it.bind(it);

describe('configuration', () => {
  const requiredArgs = [
    'dataFlowSchema',
    'foldStepResults',
    'frontController',
    'getSteps',
    'getConditions'
  ];

  const optionalArgs = [
    'bindStepToStepResults',
    'importCustomValidatorHandler',
    'initSchema',
    'initialState',
    'initValidator',
    'onResultChanged'
  ];

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

  requiredArgs.forEach((argName) => {
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

  requiredArgs.concat(optionalArgs).forEach((argName) => {
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

      const notAFunction = 'notAFunction';
      const notALiteralObject = 123;

      try {
        createAction({
          bindStepToStepResults: argName === 'bindStepToStepResults' ? notAFunction : undefined,
          dataFlowSchema: argName === 'dataFlowSchema' ? notALiteralObject : dataFlowSchema,
          foldStepResults: argName === 'foldStepResults' ? notAFunction : compileCode({ sourceCode: foldStepResults }),
          frontController: argName === 'frontController' ? notAFunction : compileCode({ sourceCode: frontController }),
          importCustomValidatorHandler: argName === 'importCustomValidatorHandler' ? notAFunction : require,
          initialState: argName === 'initialState' ? notALiteralObject : undefined,
          initSchema: argName === 'initSchema' ? notAFunction : undefined,
          initValidator: argName === 'initValidator' ? notAFunction : undefined,
          getSteps: argName === 'getSteps' ? notAFunction : compileCode({ sourceCode: steps }),
          getConditions: argName === 'getConditions' ? notAFunction : compileCode({ sourceCode: conditions }),
          onResultChanged: argName === 'onResultChanged' ? notAFunction : () => {}
        });

        done(new Error(`Uncaught wrong type of arg: ${argName}`));
      } catch (expectedError) {
        expect(expectedError.name).to.equal('Core.UnsatisfiedValidation');
        expect(expectedError).to.nested.include({ 'intermediateErrors[0].keyword': 'type' });
        //expect(expectedError).to.nested.include({ 'intermediateErrors[0].params.type': 'x-Function' });
        expect(expectedError).to.nested.include({ 'intermediateErrors[0].dataPath': `.setInput.${argName}` });
        done();
      }
    });
  });
});
