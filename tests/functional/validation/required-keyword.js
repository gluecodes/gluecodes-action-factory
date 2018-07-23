const { expect } = require('chai');
const { createAction } = require('./../../../index');
const compileCode = require('./../../helpers/compile-code');

const test = it.bind(it);

describe('required keyword', () => {
  test('missing required input', (done) => {
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
            type: 'string'
          }
        },
        required: ['someProp']
      },
      step1: { type: 'string' },
      step2: { type: 'string' },
      step3: { type: 'string' },
      getResult: { type: 'string' }
    };
    const foldStepResults = `
      ({ stepResults }) => {
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
          }),
        }
      }),
      getConditions: compileCode({ sourceCode: conditions })
    });

    resultedAction()
      .then(() => done(new Error('missing required input')))
      .catch((expectedError) => {
        try {
          expect(expectedError.name).to.equal('Core.UnsatisfiedValidation');
          done();
        } catch (err) {
          done(err);
        }
      });
  });

  test('missing optional input', (done) => {
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
            type: 'string'
          }
        }
      },
      step1: { type: 'string' },
      step2: { type: 'string' },
      step3: { type: 'string' },
      getResult: { type: 'string' }
    };
    const foldStepResults = `
      ({ stepResults }) => {
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
          }),
        }
      }),
      getConditions: compileCode({ sourceCode: conditions })
    });

    resultedAction()
      .then(result => expect(result).to.be.an('undefined'))
      .then(() => done())
      .catch(done);
  });

  test('passing input through props of objects returned by steps', (done) => {
    const steps = `
      ({ stepResults } = {}) => ({
        async step1() {
          const { setInput: { someProp } } = stepResults;
          const result = await crossProjectFunction({ someProp });
      
          return { prop1: result };
        },
        async step2() {
          const { step1: { prop1 } } = stepResults;
          const result = await crossProjectFunction({ someProp: prop1 });
      
          return { prop2: result };
        },
        async step3() {
          const { step2: { prop2 } } = stepResults;
          const result = await crossProjectFunction({ someProp: prop2 });
      
          return { prop1: result };
        }
      });
    `;
    const conditions = '({ stepResults } = {}) => ({});';
    const dataFlowSchema = {
      setInput: {
        type: 'object',
        properties: {
          someProp: {
            type: 'string'
          }
        },
        required: ['someProp']
      },
      step1: {
        type: 'object',
        properties: {
          prop1: { type: 'string' },
          prop2: { type: 'string' }
        },
        required: ['prop1']
      },
      step2: {
        type: 'object',
        properties: {
          prop1: { type: 'string' },
          prop2: { type: 'string' }
        },
        required: ['prop2']
      },
      step3: {
        type: 'object',
        properties: {
          prop1: { type: 'string' },
          prop2: { type: 'string' }
        },
        required: ['prop1']
      },
      getResult: {
        type: 'object',
        properties: {
          prop1: { type: 'string' },
          prop2: { type: 'string' }
        },
        required: ['prop2']
      }
    };
    const foldStepResults = `
      ({ stepResults }) => {
        const { step3: { prop1 } } = stepResults;
      
        return { prop2: prop1 };
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
          }),
        }
      }),
      getConditions: compileCode({ sourceCode: conditions })
    });

    const someInputProp = 'whateverInput';

    resultedAction({ someProp: someInputProp })
      .then(({ prop2 } = {}) => expect(prop2).to.equal(someInputProp))
      .then(() => done())
      .catch(done);
  });
});
