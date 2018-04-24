const { expect } = require('chai');
const { createAction } = require('./../../../index');
const compileCode = require('./../../helpers/compile-code');
const sinon = require('sinon');

const test = it.bind(it);

describe('custom validators', () => {
  test('validator returning true', (done) => {
    const validatorSpy = sinon.spy();
    const failedValidationMessage = 'Some message explaining what went wrong';

    const steps = `
      ({ stepResults } = {}) => ({
        async step1() {
          const { setInput: { someProp } } = stepResults;
          const result = await crossProjectFunction({ someProp });
      
          return result;
        },
        async step2() {
          const { step1 } = stepResults;
          const result = await crossProjectFunction({ someProp: step1 });
      
          return result;
        },
        async step3() {
          const { step2 } = stepResults;
          const result = await crossProjectFunction({ someProp: step2 });
      
          return result;
        }
      });
    `;
    const conditions = '({ stepResults } = {}) => ({});';
    const dataFlowSchema = {
      setInput: {
        type: 'object',
        properties: {
          someProp: {
            type: 'string',
            validator: {
              handler: './some-dummy-path',
              settings: {
                message: failedValidationMessage
              }
            }
          }
        }
      },
      step1: { type: 'string' },
      step2: { type: 'string' },
      step3: { type: 'string' },
      getResult: { type: 'string' }
    };
    const foldStepResults = `
      ({ stepResults } = {}) => {
        const { step3 } = stepResults;
      
        return step3;
      };
    `;
    const frontController = `
      async function({
        conditions: {},
        steps: {
          step1,
          step2,
          step3
        }
      } = {}) {
        await step1();
        await step2();
        await step3();
      };
    `;
    const crossProjectFunction = `
      async function({ someProp } = {}) { 
        const someAsyncFunction = () => new Promise((resolve, reject) => setTimeout(() => resolve(someProp), 100));
        const result = await someAsyncFunction();
        
        return result;
      }
    `;
    const importCustomValidatorHandler = `
      () => ({
        value,
        settings
      } = {}) => {
        validatorSpy(value, settings);
        return true;
      };
    `;

    const resultedAction = createAction({
      dataFlowSchema,
      foldStepResults: compileCode({ sourceCode: foldStepResults }),
      frontController: compileCode({ sourceCode: frontController }),
      getSteps: compileCode({
        sourceCode: steps,
        varsToBeInjected: {
          crossProjectFunction: compileCode({
            sourceCode: crossProjectFunction,
            varsToBeInjected: { setTimeout }
          })
        }
      }),
      getConditions: compileCode({ sourceCode: conditions }),
      importCustomValidatorHandler: compileCode({
        sourceCode: importCustomValidatorHandler,
        varsToBeInjected: {
          Promise,
          setTimeout,
          validatorSpy
        }
      })
    });

    const someInputProp = 'whateverInput';

    resultedAction({ someProp: someInputProp })
      .then((someResult) => {
        expect(validatorSpy.calledWith(someInputProp, { message: failedValidationMessage })).to.equal(true);
        expect(someResult).to.equal(someInputProp);
      })
      .then(() => done())
      .catch(done);
  });

  test('validator returning false', (done) => {
    const validatorSpy = sinon.spy();
    const failedValidationMessage = 'Some message explaining what went wrong';

    const steps = `
      ({ stepResults } = {}) => ({
        async step1() {
          const { setInput: { someProp } } = stepResults;
          const result = await crossProjectFunction({ someProp });
      
          return result;
        },
        async step2() {
          const { step1 } = stepResults;
          const result = await crossProjectFunction({ someProp: step1 });
      
          return result;
        },
        async step3() {
          const { step2 } = stepResults;
          const result = await crossProjectFunction({ someProp: step2 });
      
          return result;
        }
      });
    `;
    const conditions = '({ stepResults } = {}) => ({});';
    const dataFlowSchema = {
      setInput: {
        type: 'object',
        properties: {
          someProp: {
            type: 'string',
            validator: {
              handler: './some-dummy-path',
              settings: {
                message: failedValidationMessage
              }
            }
          }
        }
      },
      step1: { type: 'string' },
      step2: { type: 'string' },
      step3: { type: 'string' },
      getResult: { type: 'string' }
    };
    const foldStepResults = `
      ({ stepResults } = {}) => {
        const { step3 } = stepResults;
      
        return step3;
      };
    `;
    const frontController = `
      async function({
        conditions: {},
        steps: {
          step1,
          step2,
          step3
        }
      } = {}) {
        await step1();
        await step2();
        await step3();
      };
    `;
    const crossProjectFunction = `
      async function({ someProp } = {}) { 
        const someAsyncFunction = () => new Promise((resolve, reject) => setTimeout(() => resolve(someProp), 100));
        const result = await someAsyncFunction();
        
        return result;
      }
    `;
    const importCustomValidatorHandler = `
      () => ({
        value,
        settings
      } = {}) => {
        validatorSpy(value, settings);
        return false;
      };
    `;

    const resultedAction = createAction({
      dataFlowSchema,
      foldStepResults: compileCode({ sourceCode: foldStepResults }),
      frontController: compileCode({ sourceCode: frontController }),
      getSteps: compileCode({
        sourceCode: steps,
        varsToBeInjected: {
          crossProjectFunction: compileCode({
            sourceCode: crossProjectFunction,
            varsToBeInjected: { setTimeout }
          })
        }
      }),
      getConditions: compileCode({ sourceCode: conditions }),
      importCustomValidatorHandler: compileCode({
        sourceCode: importCustomValidatorHandler,
        varsToBeInjected: {
          Promise,
          setTimeout,
          validatorSpy
        }
      })
    });

    const someInputProp = 'whateverInput';

    resultedAction({ someProp: someInputProp })
      .then(() => done(new Error('validator returning false')))
      .catch((expectedError) => {
        try {
          expect(validatorSpy.calledWith(someInputProp, { message: failedValidationMessage })).to.equal(true);
          expect(expectedError.name).to.equal('Core.UnsatisfiedValidation');
          done();

        } catch (err) {
          done(err);
        }
      });
  });

  test('validator unexpectedly throwing intermediate error', (done) => {
    const validatorSpy = sinon.spy();
    const failedValidationMessage = 'Some message explaining what went wrong';
    const intermediateErrorMessage = 'Some unexpected error';

    const steps = `
      ({ stepResults } = {}) => ({
        async step1() {
          const { setInput: { someProp } } = stepResults;
          const result = await crossProjectFunction({ someProp });
      
          return result;
        },
        async step2() {
          const { step1 } = stepResults;
          const result = await crossProjectFunction({ someProp: step1 });
      
          return result;
        },
        async step3() {
          const { step2 } = stepResults;
          const result = await crossProjectFunction({ someProp: step2 });
      
          return result;
        }
      });
    `;
    const conditions = '({ stepResults } = {}) => ({});';
    const dataFlowSchema = {
      setInput: {
        type: 'object',
        properties: {
          someProp: {
            type: 'string',
            validator: {
              handler: './some-dummy-path',
              settings: {
                message: failedValidationMessage
              }
            }
          }
        }
      },
      step1: { type: 'string' },
      step2: { type: 'string' },
      step3: { type: 'string' },
      getResult: { type: 'string' }
    };
    const foldStepResults = `
      ({ stepResults } = {}) => {
        const { step3 } = stepResults;
      
        return step3;
      };
    `;
    const frontController = `
      async function({
        conditions: {},
        steps: {
          step1,
          step2,
          step3
        }
      } = {}) {
        await step1();
        await step2();
        await step3();
      };
    `;
    const crossProjectFunction = `
      async function({ someProp } = {}) { 
        const someAsyncFunction = () => new Promise((resolve, reject) => setTimeout(() => resolve(someProp), 100));
        const result = await someAsyncFunction();
        
        return result;
      }
    `;
    const importCustomValidatorHandler = `
      () => ({
        value,
        settings
      } = {}) => {
        validatorSpy(value, settings);
        throw new Error('${intermediateErrorMessage}');
      };
    `;

    const resultedAction = createAction({
      dataFlowSchema,
      foldStepResults: compileCode({ sourceCode: foldStepResults }),
      frontController: compileCode({ sourceCode: frontController }),
      getSteps: compileCode({
        sourceCode: steps,
        varsToBeInjected: {
          crossProjectFunction: compileCode({
            sourceCode: crossProjectFunction,
            varsToBeInjected: { setTimeout }
          })
        }
      }),
      getConditions: compileCode({ sourceCode: conditions }),
      importCustomValidatorHandler: compileCode({
        sourceCode: importCustomValidatorHandler,
        varsToBeInjected: {
          Promise,
          setTimeout,
          validatorSpy
        }
      })
    });

    const someInputProp = 'whateverInput';

    resultedAction({ someProp: someInputProp })
      .then(() => done(new Error('validator unexpectedly throwing intermediate error')))
      .catch((expectedError) => {
        try {
          expect(validatorSpy.calledWith(someInputProp, { message: failedValidationMessage })).to.equal(true);
          expect(expectedError.name).to.equal('Core.UnsatisfiedValidation');
          expect(expectedError).to.nested.include({ 'intermediateErrors[0].message': intermediateErrorMessage });
          done();

        } catch (err) {
          done(err);
        }
      });
  });
});
