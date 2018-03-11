# glue.codes
## Action Factory

Action Factory is a JavaScript library providing a clean way of developing apps out of pure functions.

- **Convention over configuration:** Stop wondering whether the way you structure actions is optimal. Instead follow the carefully thought-through standards we've put together, and focus on delivering features.
- **Function-first and pure:** Split big problem into many self-contained, pure functions (actions) which get some input and give a result required to perform the next step.
- **First plan then code:** Draft the function flow by defining required steps and conditions, then either re-use existing components or task out missing ones to your team members.
- **Readable:** Implement complex logic that reads like a flow chart. Decide whether code should fail or take an alternative path depending on single-state-based conditions or intermediate errors.
- **Validation:** Specify data flow schema (JSON Schema) and enhance it with custom validators to restrict not only the function input or result but whole data written to state by intermediate steps.
- **Alive functions:** Action Factory has been developed having real-time features (like Web Sockets) in mind. You can combine HTTP calls with Web Sockets together keeping the whole data flow validated and transparent to other developers.
- **glue.codes love standards:** Action Factory has been written in ES6/7 and designed around carefully thought-through standards and concepts like async functions, function argument destruction, default parameters, JSON Schema and many more.
- **Isomorphic:** It works both on backend and frontend. (WIP)

## Overview
- This module exports `combineSteps` function.
- It expects five compartments: Steps (via `getSteps`), Conditions (via `getConditions`), Fold Step Results function (via `foldStepResults`), Front Controller (via `frontController`) and Data Flow Schema (via `dataFlowSchema`) which are glued together to return a single function.

```javascript
/**
 * @param {Function} bindStepToStepResults
 * @param {object} dataFlowSchema It's a Data Flow Schema in JSON Schema format 
 * @param {Function} foldStepResults It's a Fold Step Results function
 * @param {Function} frontController It's a Front Controller
 * @param {Function} getSteps Provides Steps
 * @param {Function} getConditions Provides Conditions
 * @param {Function} importCustomValidatorHandler
 * @param {Function} initSchema
 * @param {object} initialState It's an initial state to be merged to stepResults
 * @param {Function} initValidator
 * @param {Function} onResultChanged It's triggered every time foldStepResults is called
 */
const createAction = ({
  bindStepToStepResults = _bindStepToStepResults,
  dataFlowSchema,
  foldStepResults,
  frontController,
  getSteps,
  getConditions,
  importCustomValidatorHandler = require,
  initSchema = _initSchema,
  initialState = {},
  initValidator = _initValidator,
  onResultChanged
} = {}) => {
  ...
}
```

### Steps

- It's a function which returns an object of steps to be performed by a function being combined/controlled.
- The steps are passed to Front Controller.
- It passes `stepResults` which is an object containing results of previously executed steps, the results are keyed by step name except `setInput` (function input) and `getResult` (function return value).
- Step can be either an `async` or sync function.
- Step is meant to be "skinny" i.e. it should use cross-project re-usable functions/components.
- Step must not contain execution-path-controlling conditionals, instead it should be a simple doer. The function execution path should be controlled in a Front Controller instead.
- Given an step uses well-abstracted, cross-project re-usable functions/components, code duplication makes more sense than being over-generic.
- Keep step names business-specific and reflect them in their implementation.

`steps.js`
```javascript
const someCrossProjectComponent = require('some-cross-project-component');
...

module.exports = ({ stepResults } = {}) => ({
  async someStep() {
    const { 
      setInput: { someProp }
    } = stepResults;

    const someResult = await someCrossProjectComponent({ someProp });

    ...

    return someResult;
  },
  ...
});
```

#### Alive Functions
- Steps which need to be continuously fed with data can open data receiver (call `openDataReceiver`) which allows to `sendData` whenever they arrive.
- Step which opens data receiver must be a sync function which returns `openDataReceiver` call.
- Every time after calling `sendData` Fold Step Results function is triggered, then `onResultChanged` is triggered.
- This kind of steps can be combined with normal ones and their results can be merged by Fold Step Results function e.g. on frontend you might combine initial HTTP request and keep updating its result with Web Socket.

`steps.js`
```javascript
module.exports = ({
  stepResults,
  openDataReceiver
} = {}) => ({
  someStep() {
    const {
      initSomeStream: { someEventEmitter }
    } = stepResults;

    return openDataReceiver(({ sendData } = {}) => someEventEmitter.on('data', (someData) => {
      ...
      sendData({ data: someData });
    }));
  },
  ...
});
```

### Conditions

- It's a function which returns an object of conditions (functions). 
- The Conditions are passed to a Front Controller where can be used to control the function execution path.
- It passes `stepResults` which is an object containing results of previously executed steps.
- Condition must be always a sync function referring to `stepResults`.
- Keep condition names business-specific, they should well explain why code needs to take alternative execution path.

`conditions.js`
```javascript
module.exports = ({ stepResults } = {}) => ({
  isSomePropMatchingSomeCondition() {
    const { setInput: { someProp } } = stepResults;

    return someProp === 'someAssertedValue';
  },
  ...  
});
```

### Fold Step Results

- It's a function which returns a function to be called after returning from a Front Controller.
- It passes `stepResults` which is an object containing results of previously executed steps.
- It's a higher-order function meant to recombine the `stepResults`.
- It must be always a sync function referring to `stepResults`.

`fold-step-results.js`
```javascript
module.exports = ({ stepResults } = {}) => {
  
  ...

  return { ... };
};
```
### Front Controller
- It's a function which gives a high-level view of the function business logic.
- It passes Steps and Conditions.
- It can be either an `async` or sync function.
- It must be pure i.e. has no side-effects.
- It must not use any data coming from out of its scope.
- It must not assign any data to local variables as step results are stored in `stepResults` object under their function names.
- It must return `undefined` as the actual result is provided by Fold Step Results.

`index.js`

```javascript
module.exports = async function({
  steps: {
    someStep,
    ...
  }
  conditions: {
    isSomePropMatchingSomeCondition,
    ...
  }
} = {}) {
  if (!isSomePropMatchingSomeCondition()) { return; }

  await someStep();
  ...
};
```

### Data Flow Schema
- It's an object with keys as step names (inc. `setInput` and `getResult`) and values following JSON Schema standard.
- It's used for validation after setting input props (`setInput`), performing steps and folding the step results (`getResult`) of the function.

`schema.json`
```json
{
  "setInput": {
    "type": "object",
    "properties": {
      "someProp": {
        "type": "string"
      }
    }
  },
  "someStep": { "type": "string" },
  ...
  "getResult": { "type": "string" }
}
```
