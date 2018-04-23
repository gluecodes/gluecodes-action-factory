const { expect } = require('chai');
const { createAction } = require('./../../index');
const compileCode = require('./../helpers/compile-code');

const test = it.bind(it);

describe('alive functions', () => {
  test('using alive step with normal steps', (done) => {
    const steps = `
      ({ stepResults, openDataReceiver } = {}) => ({
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
        step3() {
          return openDataReceiver(({ sendData } = {}) => {
            continuousDataProvider({ handler: sendData });
          });
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
      step3: {
        type: 'object',
        properties: {
          counter: { type: 'number' }
        }
      },
      getResult: {
        type: 'object',
        properties: {
          setInput: {
            type: 'object',
            properties: {
              someProp: { type: 'string' }
            }
          },
          step1: { type: 'string' },
          step2: { type: 'string' },
          step3: {
            type: 'object',
            properties: {
              counter: { type: 'number' }
            }
          }
        }
      }
    };
    const foldStepResults = `
      ({ stepResults } = {}) => {
        const {
          setInput,
          step1,
          step2,
          step3
        } = stepResults;
      
        return {
          setInput,
          step1,
          step2,
          step3
        };
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

    let continuousDataSubmissionCounter = 0;

    const haveAllDataBeenSubmitted = () => (continuousDataSubmissionCounter === 5);

    const continuousDataProvider = ({ handler } = {}) => {
      const interval = setInterval(() => {
        continuousDataSubmissionCounter++;

        handler({ data: { counter: continuousDataSubmissionCounter } });

        if (!haveAllDataBeenSubmitted()) { return; }

        clearInterval(interval);
      }, 100);
    };

    const resultedAction = createAction({
      dataFlowSchema,
      foldStepResults: compileCode({ sourceCode: foldStepResults }),
      frontController: compileCode({ sourceCode: frontController }),
      getSteps: compileCode({
        sourceCode: steps,
        varsToBeInjected: {
          console,
          continuousDataProvider,
          crossProjectFunction: compileCode({
            sourceCode: crossProjectFunction,
            varsToBeInjected: { setTimeout }
          })
        }
      }),
      getConditions: compileCode({ sourceCode: conditions }),
      onResultChanged: ({ result, triggeredBy } = {}) => {
        expect(triggeredBy).to.equal('step3');

        if (!haveAllDataBeenSubmitted()) { return; }

        expect(result).to.nested.include({ 'setInput.someProp': 'in' });
        expect(result).to.nested.include({ step1: 'a1in' });
        expect(result).to.nested.include({ step2: 'a2a1in' });
        expect(result).to.nested.include({ 'step3.counter': 5 });
        done();
      }
    });

    resultedAction({ someProp: 'in' })
      .then((result) => {
        expect(result).to.nested.include({ 'setInput.someProp': 'in' });
        expect(result).to.nested.include({ step1: 'a1in' });
        expect(result).to.nested.include({ step2: 'a2a1in' });
        expect(result).to.nested.include({ 'step3.counter': 0 });
      })
      .catch(done);
  });
});
