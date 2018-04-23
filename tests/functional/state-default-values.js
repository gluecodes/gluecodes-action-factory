const { expect } = require('chai');
const { createAction } = require('./../../index');
const compileCode = require('./../helpers/compile-code');

const test = it.bind(it);

describe('state default values', () => {
  const defaultValuesPerDataType = {
    array: [true, false, 1, -1, 0.01, -0.01, 'two'],
    boolean: true,
    integer: 1,
    number: 0.01,
    string: 'some string'
  };

  Object.keys(defaultValuesPerDataType).forEach((dataType) => {
    const defaultValue = defaultValuesPerDataType[dataType];

    test(`state gets initialized with prop default values ('${dataType}')`, (done) => {
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
            someProp: { type: dataType, default: defaultValue }
          },
          required: ['someProp']
        },
        step1: {
          type: 'object',
          properties: {
            someDefinedProp: { type: dataType, default: defaultValue },
            initializedProp: { type: dataType, default: defaultValue },
            undefinedProp: { type: dataType, default: defaultValue }
          }
        },
        getResult: {
          type: 'object',
          properties: {
            someNestedProp: {
              type: 'object',
              properties: {
                someDefinedProp: { type: dataType, default: defaultValue },
                initializedProp: { type: dataType, default: defaultValue },
                undefinedProp: { type: dataType, default: defaultValue }
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

      resultedAction({ someProp: undefined })
        .then((result) => {
          if (dataType === 'array') {
            const {
              someNestedProp: {
                someDefinedProp,
                initializedProp,
                undefinedProp
              }
            } = result;

            expect(JSON.stringify(someDefinedProp)).to.equal('[true,false,1,-1,0.01,-0.01,"two"]');
            expect(JSON.stringify(initializedProp)).to.equal('[true,false,1,-1,0.01,-0.01,"two"]');
            expect(JSON.stringify(undefinedProp)).to.be.an('undefined');
            return;
          }

          expect(result).to.nested.include({ 'someNestedProp.someDefinedProp': defaultValue });
          expect(result).to.nested.include({ 'someNestedProp.initializedProp': defaultValue });
          expect(result).to.have.nested.property('someNestedProp.undefinedProp').that.is.an('undefined');
        })
        .then(() => done())
        .catch(done);
    });
  });

  Object.keys(defaultValuesPerDataType).forEach((dataType) => {
    const defaultValue = defaultValuesPerDataType[dataType];

    test(`setting null on props resets them to their default values ('${dataType}')`, (done) => {
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
            someProp: { type: dataType, default: defaultValue }
          }
        },
        step1: { type: dataType, default: defaultValue },
        getResult: {
          type: 'object',
          properties: {
            someNestedProp: { type: dataType, default: defaultValue }
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

      resultedAction({ someProp: undefined })
        .then((result) => {
          if (dataType === 'array') {
            expect(JSON.stringify(result.someNestedProp)).to.equal('[true,false,1,-1,0.01,-0.01,"two"]');
            return;
          }

          expect(result).to.nested.include({ someNestedProp: defaultValue });
        })
        .then(() => done())
        .catch(done);
    });
  });
});
