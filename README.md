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
- **Isomorphic:** It works both on backend and frontend.

## Example

Suppose you want to create `orderPizza()` function described in pseudo-code as follows:

```
inputs:
  - address
  - email
  - first name (optional)
  - last name (optional)
  - ordered items
  - password (optional)

returns:
  - approximate delivery time

logic:
  'find address by postcode'

  if 'address found and no unexpected errors'
    'refine customer address'

  if 'the function inputs: firstName, lastName and password'
    'save customer profile'
    'send welcome email'

  'submit order to restaurant API'
  'send order confirmation email'
```

with the following business rules by each step:

**'find address by postcode':**
- if succeeded, returns a verified address object
- if address not found, returns null
- if failed, throws an error but the orderPizza function should continue

**'refine customer address':**
- if succeeded, returns either address returned by 'find address by postcode' or the one provided in the input
- if failed, the orderPizza function should throw the failure error

**'save customer profile':**
- saves customer profile in DB
- if succeeded, returns customerId
- if failed, if failed, the orderPizza function should throw the failure error

**'send welcome email':**
- sends an email containing 'first name'
- if succeeded, returns true
- if failed, throws an error but the orderPizza function should continue

**'submit order to restaurant API':**
- submits 'ordered items' along with verified customer address and email
- if succeeded, returns an object with 'approximate delivery time' or null
- if failed, the orderPizza function should throw the failure error

**'send order confirmation email':**
- sends an email containing 'approximate delivery time'
- if succeeded, returns true
- if failed, throws an error but the orderPizza function should continue

This is how you could implement it with Action Factory:

1. Check [Front Controller](https://github.com/gluecodes/gluecodes-action-factory/blob/master/examples/order-pizza/index.js) to see the overall logic of the function.
2. Check [Steps](https://github.com/gluecodes/gluecodes-action-factory/blob/master/examples/order-pizza/steps.js) and [Conditions](https://github.com/gluecodes/gluecodes-action-factory/blob/master/examples/order-pizza/conditions.js) used in the Front Controller.
3. Check [Fold Step Results](https://github.com/gluecodes/gluecodes-action-factory/blob/master/examples/order-pizza/fold-step-results.js) to see what data the function resolves/returns.
4. Check [Input Schema](https://github.com/gluecodes/gluecodes-action-factory/blob/master/examples/order-pizza/schemas/set-input.js) to see input validation of the function.
5. Check [Result Schema](https://github.com/gluecodes/gluecodes-action-factory/blob/master/examples/order-pizza/schemas/get-result.json) to see validation of what the function resolves/returns.
6. Check [Intermediate Step Schemas](https://github.com/gluecodes/gluecodes-action-factory/blob/master/examples/order-pizza/schemas) to see validation of all intermediate steps.
7. Check [Functional Test](https://github.com/gluecodes/gluecodes-action-factory/blob/master/examples/order-pizza/tests/functional.js) to see how to glue and test the function.

further documentation (wip)

## Overview
- This module exports `createAction` function.
- It expects five compartments: Steps (via `getSteps`), Conditions (via `getConditions`), Fold Step Results function (via `foldStepResults`), Front Controller (via `frontController`) and Data Flow Schema (via `dataFlowSchema`) which are glued together to return a single function.

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

module.exports = ({ stepResults }) => ({
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
}) => ({
  someStep() {
    const {
      initSomeStream: { someEventEmitter }
    } = stepResults;

    return openDataReceiver(({ sendData }) => someEventEmitter.on('data', (someData) => {
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
module.exports = ({ stepResults }) => ({
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
module.exports = ({ stepResults }) => {
  
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
module.exports = async ({
  steps: {
    someStep,
    ...
  }
  conditions: {
    isSomePropMatchingSomeCondition,
    ...
  }
}) => {
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

### Tests

run: `npm test`

### Contributing

create an issue or contact hello@glue.codes

### License

[MIT](https://github.com/gluecodes/gluecodes-action-factory/blob/master/LICENSE.md)

### Acknowledgements

#### Contributors:
- Daniel Perez Parada (@danielperezparada) - for help in identifying potential issues and testing
