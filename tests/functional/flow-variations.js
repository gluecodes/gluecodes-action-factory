const { expect } = require('chai');
const { createAction } = require('./../../index');
const compileCode = require('./../helpers/compile-code');

const test = it.bind(it);

describe('flow variations', () => {
  test('passing single input value through multiple async steps', (done) => {
    const steps = `
      ({ stepResults } = {}) => ({
        async step1() {
          const { setInput: { someProp } } = stepResults;
          const result = await crossProjectFunction({ someProp: 'a1' + someProp });
      
          return result;
        },
        async step2() {
          const { step1 } = stepResults;
          const result = await crossProjectFunction({ someProp: 'a2' + step1 });
      
          return result;
        },
        async step3() {
          const { step2 } = stepResults;
          const result = await crossProjectFunction({ someProp: 'a3' + step2 });
      
          return result;
        }
      });
    `;
    const conditions = '({ stepResults } = {}) => ({});';
    const dataFlowSchema = {
      setInput: {
        type: 'object',
        properties: {
          someProp: { type: 'string' }
        }
      },
      step1: { type: 'string' },
      step2: { type: 'string' },
      step3: { type: 'string' },
      getResult: { type: 'string' }
    };
    const foldStepResults = `
      ({ stepResults } = {}) => {
        const {
          setInput: { someProp },
          step1,
          step2,
          step3
        } = stepResults;
      
        const result = [
          someProp,
          step1,
          step2,
          step3
        ].join(';');
      
        return result;
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

    resultedAction({ someProp: 'in' })
      .then(result => expect(result).to.equal('in;a1in;a2a1in;a3a2a1in'))
      .then(() => done())
      .catch(done);
  });

  test('passing single input value through multiple sync steps', (done) => {
    const steps = `
      ({ stepResults } = {}) => ({
        step1() {
          const { setInput: { someProp } } = stepResults;
          const result = crossProjectFunction({ someProp: 'a1' + someProp });
                
          return result;
        },
        step2() {
          const { step1 } = stepResults;
          const result = crossProjectFunction({ someProp: 'a2' + step1 });
                
          return result;
        },
        step3() {
          const { step2 } = stepResults;
          const result = crossProjectFunction({ someProp: 'a3' + step2 });
      
          return result;
        }
      });
    `;
    const conditions = '({ stepResults } = {}) => ({});';
    const dataFlowSchema = {
      setInput: {
        type: 'object',
        properties: {
          someProp: { type: 'string' }
        }
      },
      step1: { type: 'string' },
      step2: { type: 'string' },
      step3: { type: 'string' },
      getResult: { type: 'string' }
    };
    const foldStepResults = `
      ({ stepResults } = {}) => {
        const {
          setInput: { someProp },
          step1,
          step2,
          step3
        } = stepResults;
      
        const result = [
          someProp,
          step1,
          step2,
          step3
        ].join(';');
      
        return result;
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
        step1();
        step2();
        step3();
      };
    `;
    const crossProjectFunction = `
      ({ someProp } = {}) => (someProp)
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

    resultedAction({ someProp: 'in' })
      .then(result => expect(result).to.equal('in;a1in;a2a1in;a3a2a1in'))
      .then(() => done())
      .catch(done);
  });

  test('passing single input value through multiple async and sync steps', (done) => {
    const steps = `
      ({ stepResults } = {}) => ({
        async step1() {
          const { setInput: { someProp } } = stepResults;
          const result = await crossProjectFunction({ someProp: 'a1' + someProp });
      
          return result;
        },
        step2() {
          const { step1 } = stepResults;
          const result = 'a2' + step1;
      
          return result;
        },
        async step3() {
          const { step2 } = stepResults;
          const result = await crossProjectFunction({ someProp: 'a3' + step2 });
      
          return result;
        }
      });
    `;
    const conditions = '({ stepResults } = {}) => ({});';
    const dataFlowSchema = {
      setInput: {
        type: 'object',
        properties: {
          someProp: { type: 'string' }
        }
      },
      step1: { type: 'string' },
      step2: { type: 'string' },
      step3: { type: 'string' },
      getResult: { type: 'string' }
    };
    const foldStepResults = `
      ({ stepResults } = {}) => {
        const {
          setInput: { someProp },
          step1,
          step2,
          step3
        } = stepResults;
      
        const result = [
          someProp,
          step1,
          step2,
          step3
        ].join(';');
      
        return result;
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
        step2();
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

    resultedAction({ someProp: 'in' })
      .then(result => expect(result).to.equal('in;a1in;a2a1in;a3a2a1in'))
      .then(() => done())
      .catch(done);
  });

  test('passing single input value through multiple steps with conditions', (done) => {
    const steps = `
      ({ stepResults } = {}) => ({
        async step1() {
          const { setInput: { someProp } } = stepResults;
          const result = await crossProjectFunction({ someProp: 'a1' + someProp });
      
          return result;
        },
        async step2() {
          const { step1 } = stepResults;
          const result = await crossProjectFunction({ someProp: 'a2' + step1 });
      
          return result;
        },
        async step3() {
          const { step2 } = stepResults;
          const result = await crossProjectFunction({ someProp: 'a3' + step2 });
      
          return result;
        }
      });
    `;
    const conditions = `
      ({ stepResults } = {}) => ({
        isCondition1Met() {
          return false;
        },
        isCondition2Met({ step2 } = {}) {
          return step2 === 'a2a1in';
        }
      });
    `;
    const dataFlowSchema = {
      setInput: {
        type: 'object',
        properties: {
          someProp: { type: 'string' }
        }
      },
      step1: { type: 'string' },
      step2: { type: 'string' },
      step3: { type: 'string' },
      getResult: { type: 'string' }
    };
    const foldStepResults = `
      ({ stepResults } = {}) => {
        const {
          setInput: { someProp },
          step1,
          step2,
          step3
        } = stepResults;
      
        const result = [
          someProp,
          step1,
          step2,
          step3
        ].join(';');
      
        return result;
      };
    `;
    const frontController = `
      async function({
        conditions: {
          isCondition1Met,
          isCondition2Met
        },
        steps: {
          step1,
          step2,
          step3
        }
      } = {}) {
        if (!isCondition1Met) { return; }
      
        await step1();
        
        if (!isCondition2Met) { return; }
        
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

    resultedAction({ someProp: 'in' })
      .then(result => expect(result).to.equal('in;a1in;a2a1in;a3a2a1in'))
      .then(() => done())
      .catch(done);
  });

  test('same step called multiple times', (done) => {
    const steps = `
      ({ stepResults } = {}) => ({
        async step1() {
          const { setInput: { someProp } } = stepResults;
          const result = await crossProjectFunction({ someProp: 'a1' + someProp });
      
          return result;
        },
        async step2() {
          const { step1, step2 = '' } = stepResults;
          const result = await crossProjectFunction({ someProp: 'a2' + step1 + step2 });
      
          return result;
        },
        async step3() {
          const { step2 } = stepResults;
          const result = await crossProjectFunction({ someProp: 'a3' + step2 });
      
          return result;
        }
      });
    `;
    const conditions = '({ stepResults } = {}) => ({});';
    const dataFlowSchema = {
      setInput: {
        type: 'object',
        properties: {
          someProp: { type: 'string' }
        }
      },
      step1: { type: 'string' },
      step2: { type: 'string' },
      step3: { type: 'string' },
      getResult: { type: 'string' }
    };
    const foldStepResults = `
      ({ stepResults } = {}) => {
        const {
          setInput: { someProp },
          step1,
          step2,
          step3
        } = stepResults;
      
        const result = [
          someProp,
          step1,
          step2,
          step3
        ].join(';');
      
        return result;
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

    resultedAction({ someProp: 'in' })
      .then(result => expect(result).to.equal('in;a1in;a2a1ina2a1in;a3a2a1ina2a1in'))
      .then(() => done())
      .catch(done);
  });
});
