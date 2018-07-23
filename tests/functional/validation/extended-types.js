const { expect } = require('chai');
const { createAction } = require('./../../../index');
const compileCode = require('./../../helpers/compile-code');

const test = it.bind(it);

describe('extended types', () => {
  const SomeConstructor = function () {}; // eslint-disable-line func-names
  class SomeClass {}
  const dataTypeExamples = [
    {
      name: 'Function',
      acceptableValue: function () {} // eslint-disable-line object-shorthand, func-names
    },
    {
      name: 'Function',
      acceptableValue: () => {}
    },
    {
      name: 'AsyncFunction',
      acceptableValue: (async () => {})
    },
    {
      name: 'RegExp',
      acceptableValue: new RegExp('^.+$')
    },
    {
      name: 'SomeConstructor',
      acceptableValue: new SomeConstructor()
    },
    {
      name: 'SomeClass',
      acceptableValue: new SomeClass()
    }
  ];

  dataTypeExamples.forEach(({ name, acceptableValue }) => {
    test(`passing value: '${name}' matches its extended type`, (done) => {
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
              type: `x-${name}`
            }
          }
        },
        step1: { type: `x-${name}` },
        step2: { type: `x-${name}` },
        step3: { type: `x-${name}` },
        getResult: { type: `x-${name}` }
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
            })
          }
        }),
        getConditions: compileCode({ sourceCode: conditions })
      });

      const someInputProp = acceptableValue;

      resultedAction({ someProp: someInputProp })
        .then((someResult) => {
          expect(someResult).to.equal(someInputProp);
        })
        .then(() => done())
        .catch(done);
    });
  });

  dataTypeExamples.forEach((givenDataTypeItem, i) => {
    dataTypeExamples.forEach((dataTypeItemToAssertAgainst, j) => {
      const isItGivenDataType = givenDataTypeItem.name === dataTypeItemToAssertAgainst.name || j === i;

      if (isItGivenDataType) { return; }

      // eslint-disable-next-line max-len
      test(`passing value: '${givenDataTypeItem.name}' doesn't match extended type: '${dataTypeItemToAssertAgainst.name}'`, (done) => {
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
                type: `x-${givenDataTypeItem.name}`
              }
            }
          },
          step1: { type: `x-${givenDataTypeItem.name}` },
          step2: { type: `x-${givenDataTypeItem.name}` },
          step3: { type: `x-${givenDataTypeItem.name}` },
          getResult: { type: `x-${givenDataTypeItem.name}` }
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
              })
            }
          }),
          getConditions: compileCode({ sourceCode: conditions })
        });

        const someInputProp = dataTypeItemToAssertAgainst.acceptableValue;

        resultedAction({ someProp: someInputProp })
          .then(() => done(new Error('validator returning false')))
          .catch((expectedError) => {
            try {
              expect(expectedError.name).to.equal('Core.UnsatisfiedValidation');
              done();
            } catch (err) {
              done(err);
            }
          });
      });
    });
  });
});
