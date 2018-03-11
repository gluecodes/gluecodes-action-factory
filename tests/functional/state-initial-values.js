const { expect } = require('chai');
const { createAction } = require('./../../index');
const compileCode = require('./../helpers/compile-code');

const test = it.bind(it);

const initialValuesPerDataType = {
  array: [],
  boolean: false,
  integer: 0,
  number: 0,
  string: ''
};

describe('state initial values', () => {
  Object.keys(initialValuesPerDataType).forEach((dataType) => {
    const initialValue = initialValuesPerDataType[dataType];

    test(`state gets initialized with prop initial values ('${dataType}')`, (done) => {
      const steps = `
        ({ stepResults } = {}) => ({
          async step1() {
            const { 
              setInput: { someProp }, 
              step1: { initializedProp } 
            } = stepResults;
            
            const result = await crossProjectFunction({ someProp });
        
            return {
              someDefinedProp: result,
              initializedProp
            };
          }
        });
      `;
      const conditions = '({ stepResults } = {}) => ({});';
      const dataFlowSchema = {
        setInput: {
          type: 'object',
          properties: {
            someProp: { type: dataType }
          }
        },
        step1: {
          type: 'object',
          properties: {
            someDefinedProp: { type: dataType },
            initializedProp: { type: dataType },
            undefinedProp: { type: dataType }
          }
        },
        getResult: {
          type: 'object',
          properties: {
            someNestedProp: {
              type: 'object',
              properties: {
                someDefinedProp: { type: dataType },
                initializedProp: { type: dataType },
                undefinedProp: { type: dataType }
              }
            }
          }
        }
      };
      const foldStepResults = `
        ({ stepResults } = {}) => {
          const { 
            step1: { 
              someDefinedProp,
              initializedProp,
              undefinedProp
            }
          } = stepResults;
        
          return { 
            someNestedProp: { 
              someDefinedProp, 
              initializedProp,
              undefinedProp 
            } 
          };
        };
      `;
      const frontController = `
        async function({
          conditions: {},
          steps: { step1 }
        } = {}) {
          await step1();
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
            console,
            crossProjectFunction: compileCode({
              sourceCode: crossProjectFunction,
              varsToBeInjected: { setTimeout }
            })
          }
        }),
        getConditions: compileCode({ sourceCode: conditions })
      });

      resultedAction({ someProp: null })
        .then((result) => {
          if (dataType === 'array') {
            expect(JSON.stringify(result.someNestedProp.someDefinedProp)).to.equal('[]');
            expect(JSON.stringify(result.someNestedProp.initializedProp)).to.equal('[]');
            expect(JSON.stringify(result.someNestedProp.undefinedProp)).to.be.an('undefined');
            return;
          }

          expect(result).to.nested.include({ 'someNestedProp.someDefinedProp': initialValue });
          expect(result).to.nested.include({ 'someNestedProp.initializedProp': initialValue });
          expect(result).to.have.nested.property('someNestedProp.undefinedProp').that.is.an('undefined');
        })
        .then(() => done())
        .catch(done);
    });
  });

  Object.keys(initialValuesPerDataType).forEach((dataType) => {
    const initialValue = initialValuesPerDataType[dataType];

    test(`setting null on props resets them to their initial values ('${dataType}')`, (done) => {
      const steps = `
        ({ stepResults } = {}) => ({
          async step1() {
            const { setInput: { someProp } } = stepResults;
            const result = await crossProjectFunction({ someProp });
        
            return result;
          }
        });
      `;
      const conditions = '({ stepResults } = {}) => ({});';
      const dataFlowSchema = {
        setInput: {
          type: 'object',
          properties: {
            someProp: { type: dataType }
          }
        },
        step1: { type: dataType },
        getResult: {
          type: 'object',
          properties: {
            someNestedProp: { type: dataType }
          }
        }
      };
      const foldStepResults = `
        ({ stepResults } = {}) => {
          const { step1 } = stepResults;
        
          return { someNestedProp: step1 };
        };
      `;
      const frontController = `
        async function({
          conditions: {},
          steps: { step1 }
        } = {}) {
          await step1();
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
            console,
            crossProjectFunction: compileCode({
              sourceCode: crossProjectFunction,
              varsToBeInjected: { setTimeout }
            })
          }
        }),
        getConditions: compileCode({ sourceCode: conditions })
      });

      resultedAction({ someProp: null })
        .then((result) => {
          if (dataType === 'array') {
            expect(JSON.stringify(result.someNestedProp)).to.equal('[]');
            return;
          }

          expect(result).to.nested.include({ someNestedProp: initialValue });
        })
        .then(() => done())
        .catch(done);
    });
  });
});
