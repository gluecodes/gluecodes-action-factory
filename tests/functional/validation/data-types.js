const { expect } = require('chai');
const { createAction } = require('./../../../index');
const compileCode = require('./../../helpers/compile-code');

const test = it.bind(it);

const dataTypeExamples = [
  {
    type: 'array',
    acceptableValues: {
      'empty array': [],
      'array of primitive values': [true, false, 1, -1, 0.01, -0.01, 'two'],
      'array of arrays': [[], [[]]],
      'array of objects': [{}, {}]
    },
    schema: {
      type: 'array'
    }
  },
  {
    type: 'boolean',
    acceptableValues: {
      'true': true, // eslint-disable-line quote-props
      'false': false // eslint-disable-line quote-props
    },
    schema: {
      type: 'boolean'
    }
  },
  {
    type: 'integer',
    acceptableValues: {
      positive: 10,
      negative: -10,
      zero: 0
    },
    schema: {
      type: 'integer'
    }
  },
  {
    type: 'number',
    acceptableValues: {
      'positive int': 10,
      'negative int': -10,
      zero: 0,
      'positive float': 0.01,
      'negative float': -0.01
    },
    schema: {
      type: 'number'
    }
  },
  /*{
    type: 'null',
    acceptableValues: {
      'null': null // eslint-disable-line quote-props
    },
    schema: {
      type: 'null'
    }
  },*/
  {
    type: 'object',
    acceptableValues: {
      'empty object': {},
      'object of nested objects': { a: {}, b: { c: {} } }
    },
    schema: {
      type: 'object',
      properties: {}
    }
  },
  {
    type: 'string',
    acceptableValues: {
      string: 'some string'
    },
    schema: {
      type: 'string'
    }
  }
];

describe('validation', () => {
  dataTypeExamples.forEach((givenDataTypeItem) => {
    const {
      type,
      acceptableValues,
      schema
    } = givenDataTypeItem;
    const givenDataType = type;
    const givenDataTypeAcceptableValues = acceptableValues;
    const givenDataTypeSchema = schema;

    Object.keys(givenDataTypeAcceptableValues).forEach((valueDescription) => {
      const valueToBeAssertedAgainst = givenDataTypeAcceptableValues[valueDescription];

      test(`'${givenDataType}' asserted against '${givenDataType}' (${valueDescription})`, (done) => {
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
              someProp: givenDataTypeSchema
            }
          },
          step1: givenDataTypeSchema,
          step2: givenDataTypeSchema,
          step3: givenDataTypeSchema,
          getResult: givenDataTypeSchema
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

        resultedAction({ someProp: valueToBeAssertedAgainst })
          .then((result) => {
            const testableValue = JSON.stringify(result);
            const stringifiedValueToBeAssertedAgainst = JSON.stringify(valueToBeAssertedAgainst);

            expect(testableValue).to.equal(stringifiedValueToBeAssertedAgainst);
          })
          .then(() => done())
          .catch(done);
      });
    });
  });

  dataTypeExamples.forEach((givenDataTypeItem, i) => {
    const {
      type,
      schema
    } = givenDataTypeItem;
    const givenDataType = type;
    const givenDataTypeSchema = schema;

    dataTypeExamples.forEach((dataTypeItemToAssertAgainst, j) => {
      const isItGivenDataType = j === i;

      if (isItGivenDataType) { return; }

      const dataTypeToAssertAgainst = dataTypeItemToAssertAgainst.type;
      const valuesToBeAssertedAgainst = dataTypeExamples[j].acceptableValues;

      Object.keys(valuesToBeAssertedAgainst).forEach((valueDescription) => {
        const isItNumericInt = ['positive int', 'negative int', 'zero'].indexOf(valueDescription) !== -1;
        const isItAssertionOfIntToNumericInt = givenDataType === 'integer' && isItNumericInt;
        const isItAssertionOfNumberToInt = givenDataType === 'number' && dataTypeToAssertAgainst === 'integer';

        if (isItAssertionOfIntToNumericInt || isItAssertionOfNumberToInt) { return; }

        const valueToBeAssertedAgainst = valuesToBeAssertedAgainst[valueDescription];

        test(`'${givenDataType}' asserted against '${dataTypeToAssertAgainst}' (${valueDescription})`, (done) => {
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
                someProp: givenDataTypeSchema
              }
            },
            step1: givenDataTypeSchema,
            step2: givenDataTypeSchema,
            step3: givenDataTypeSchema,
            getResult: givenDataTypeSchema
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

          resultedAction({ someProp: valueToBeAssertedAgainst })
            .then(() => done(new Error(`'${givenDataType}' asserted against '${dataTypeToAssertAgainst}' (${valueDescription})`)))
            .catch((expectedError) => {
              try {
                expect(expectedError.name).to.equal('UnsatisfiedValidation');
                done();

              } catch (err) {
                done(err);
              }
            });
        });
      });
    });
  });
});
