const { expect } = require('chai');
const sinon = require('sinon');
const { createAction } = require('../../../index');

const dataFlowSchema = {
  getResult: require('../schemas/get-result.json'),
  setInput: require('../schemas/set-input'),
  findAddressByPostcode: require('../schemas/find-address-by-postcode'),
  notifyRestaurant: require('../schemas/notify-restaurant.json'),
  refineCustomerAddress: require('../schemas/refine-customer-address'),
  saveProfile: require('../schemas/save-profile.json'),
  sendOrderConfirmationEmail: require('../schemas/send-order-confirmation-email.json'),
  sendWelcomeEmail: require('../schemas/send-welcome-email.json')
};

const foldStepResults = require('../fold-step-results');
const frontController = require('../index');
const getConditions = require('../conditions');
const getSteps = require('../steps');

const defaultApproximateDeliveryTime = '1 hour 30 minutes';

const getWelcomeEmailSubject = () => 'Greetings from GlueCodes';
const getWelcomeEmailBody = ({ firstName }) => `Hello ${firstName}, your profile has been created`;

const getOrderConfirmationEmailSubject = () => 'Your order is on its way';

const getOrderConfirmationEmailBody = ({ approximateDeliveryTime }) => (
  `Your pizza will be delivered approximately in ${approximateDeliveryTime}`
);

describe('order pizza', () => {
  describe('submit order without creating a customer profile', () => {
    let input;

    before(() => {
      input = {
        address: {
          line1: 'Buckingham Palace',
          postcode: 'SW1A 1AA',
          town: 'London'
        },
        email: 'hello@glue.codes',
        orderedItems: [
          {
            id: 'somePizzaId',
            quantity: 1
          },
          {
            id: 'someSideId',
            quantity: 2
          }
        ]
      };
    });

    it('no approximateDeliveryTime returned from restaurant', async () => {
      const verifiedAddress = Object.assign({}, input.address, {
        hasItBeenVerified: true,
        line2: input.address.line2,
        line3: input.address.line3
      });

      const spies = {
        addProfileToDb: sinon.spy(),
        fetchAddressForPostcode: sinon.stub().returns(input.address),
        sendOrderConfirmationEmail: sinon.spy(),
        sendWelcomeEmail: sinon.spy(),
        submitOrderToRestaurant: sinon.stub().returns({ approximateDeliveryTime: null })
      };

      const orderPizza = createAction({
        dataFlowSchema,
        foldStepResults,
        frontController,
        getConditions,
        getSteps: ({ stepResults }) => getSteps(Object.assign({ stepResults }, spies))
      });

      const approximateDeliveryTime = await orderPizza(input);

      expect(spies.addProfileToDb.notCalled).to.equal(true);

      expect(spies.fetchAddressForPostcode.calledWith({ postcode: input.address.postcode })).to.equal(true);

      expect(spies.sendOrderConfirmationEmail.calledWith({
        body: getOrderConfirmationEmailBody({ approximateDeliveryTime: defaultApproximateDeliveryTime }),
        email: input.email,
        subject: getOrderConfirmationEmailSubject()
      })).to.equal(true);

      expect(spies.sendWelcomeEmail.notCalled).to.equal(true);

      expect(spies.submitOrderToRestaurant.calledWith({
        address: verifiedAddress,
        email: input.email,
        items: input.orderedItems
      })).to.equal(true);

      expect(approximateDeliveryTime).to.equal(defaultApproximateDeliveryTime);
    });

    it('approximateDeliveryTime given by restaurant', async () => {
      const restaurantApproximateDeliveryTime = '45 minutes';

      const verifiedAddress = Object.assign({}, input.address, {
        hasItBeenVerified: true,
        line2: input.address.line2,
        line3: input.address.line3
      });

      const spies = {
        addProfileToDb: sinon.spy(),
        fetchAddressForPostcode: sinon.stub().returns(input.address),
        sendOrderConfirmationEmail: sinon.spy(),
        sendWelcomeEmail: sinon.spy(),
        submitOrderToRestaurant: sinon.stub().returns({ approximateDeliveryTime: restaurantApproximateDeliveryTime })
      };

      const orderPizza = createAction({
        dataFlowSchema,
        foldStepResults,
        frontController,
        getConditions,
        getSteps: ({ stepResults }) => getSteps(Object.assign({ stepResults }, spies))
      });

      const approximateDeliveryTime = await orderPizza(input);

      expect(spies.addProfileToDb.notCalled).to.equal(true);

      expect(spies.fetchAddressForPostcode.calledWith({ postcode: input.address.postcode })).to.equal(true);

      expect(spies.sendOrderConfirmationEmail.calledWith({
        body: getOrderConfirmationEmailBody({ approximateDeliveryTime: restaurantApproximateDeliveryTime }),
        email: input.email,
        subject: getOrderConfirmationEmailSubject()
      })).to.equal(true);

      expect(spies.sendWelcomeEmail.notCalled).to.equal(true);

      expect(spies.submitOrderToRestaurant.calledWith({
        address: verifiedAddress,
        email: input.email,
        items: input.orderedItems
      })).to.equal(true);

      expect(approximateDeliveryTime).to.equal(restaurantApproximateDeliveryTime);
    });

    it('fetchAddressForPostcode() returns null', async () => {
      const spies = {
        addProfileToDb: sinon.spy(),
        fetchAddressForPostcode: sinon.stub().returns(null),
        sendOrderConfirmationEmail: sinon.spy(),
        sendWelcomeEmail: sinon.spy(),
        submitOrderToRestaurant: sinon.stub().returns({ approximateDeliveryTime: defaultApproximateDeliveryTime })
      };

      const verifiedAddress = Object.assign({}, input.address, {
        hasItBeenVerified: false,
        line2: input.address.line2,
        line3: input.address.line3
      });

      const orderPizza = createAction({
        dataFlowSchema,
        foldStepResults,
        frontController,
        getConditions,
        getSteps: ({ stepResults }) => getSteps(Object.assign({ stepResults }, spies))
      });

      const approximateDeliveryTime = await orderPizza(input);

      expect(spies.addProfileToDb.notCalled).to.equal(true);

      expect(spies.fetchAddressForPostcode.calledWith({ postcode: input.address.postcode })).to.equal(true);

      expect(spies.sendOrderConfirmationEmail.calledWith({
        body: getOrderConfirmationEmailBody({ approximateDeliveryTime: defaultApproximateDeliveryTime }),
        email: input.email,
        subject: getOrderConfirmationEmailSubject()
      })).to.equal(true);

      expect(spies.sendWelcomeEmail.notCalled).to.equal(true);

      expect(spies.submitOrderToRestaurant.calledWith({
        address: verifiedAddress,
        email: input.email,
        items: input.orderedItems
      })).to.equal(true);

      expect(approximateDeliveryTime).to.equal(defaultApproximateDeliveryTime);
    });

    it('fetchAddressForPostcode() rejects with an error', async () => {
      const spies = {
        addProfileToDb: sinon.spy(),
        fetchAddressForPostcode: sinon.stub().rejects(new Error()),
        sendOrderConfirmationEmail: sinon.spy(),
        sendWelcomeEmail: sinon.spy(),
        submitOrderToRestaurant: sinon.stub().returns({ approximateDeliveryTime: defaultApproximateDeliveryTime })
      };

      const verifiedAddress = Object.assign({}, input.address, {
        hasItBeenVerified: false,
        line2: input.address.line2,
        line3: input.address.line3
      });

      const orderPizza = createAction({
        dataFlowSchema,
        foldStepResults,
        frontController,
        getConditions,
        getSteps: ({ stepResults }) => getSteps(Object.assign({ stepResults }, spies))
      });

      const approximateDeliveryTime = await orderPizza(input);

      expect(spies.addProfileToDb.notCalled).to.equal(true);

      expect(spies.fetchAddressForPostcode.calledWith({ postcode: input.address.postcode })).to.equal(true);

      expect(spies.sendOrderConfirmationEmail.calledWith({
        body: getOrderConfirmationEmailBody({ approximateDeliveryTime: defaultApproximateDeliveryTime }),
        email: input.email,
        subject: getOrderConfirmationEmailSubject()
      })).to.equal(true);

      expect(spies.sendWelcomeEmail.notCalled).to.equal(true);

      expect(spies.submitOrderToRestaurant.calledWith({
        address: verifiedAddress,
        email: input.email,
        items: input.orderedItems
      })).to.equal(true);

      expect(approximateDeliveryTime).to.equal(defaultApproximateDeliveryTime);
    });

    it('sendOrderConfirmationEmail() rejects with an error', async () => {
      const spies = {
        addProfileToDb: sinon.spy(),
        fetchAddressForPostcode: sinon.stub().returns(input.address),
        sendOrderConfirmationEmail: sinon.stub().rejects(new Error()),
        sendWelcomeEmail: sinon.spy(),
        submitOrderToRestaurant: sinon.stub().returns({ approximateDeliveryTime: defaultApproximateDeliveryTime })
      };

      const verifiedAddress = Object.assign({}, input.address, {
        hasItBeenVerified: true,
        line2: input.address.line2,
        line3: input.address.line3
      });

      const orderPizza = createAction({
        dataFlowSchema,
        foldStepResults,
        frontController,
        getConditions,
        getSteps: ({ stepResults }) => getSteps(Object.assign({ stepResults }, spies))
      });

      const approximateDeliveryTime = await orderPizza(input);

      expect(spies.addProfileToDb.notCalled).to.equal(true);

      expect(spies.fetchAddressForPostcode.calledWith({ postcode: input.address.postcode })).to.equal(true);

      expect(spies.sendOrderConfirmationEmail.calledWith({
        body: getOrderConfirmationEmailBody({ approximateDeliveryTime: defaultApproximateDeliveryTime }),
        email: input.email,
        subject: getOrderConfirmationEmailSubject()
      })).to.equal(true);

      expect(spies.sendWelcomeEmail.notCalled).to.equal(true);

      expect(spies.submitOrderToRestaurant.calledWith({
        address: verifiedAddress,
        email: input.email,
        items: input.orderedItems
      })).to.equal(true);

      expect(approximateDeliveryTime).to.equal(defaultApproximateDeliveryTime);
    });

    it('sendWelcomeEmail() rejects with an error', async () => {
      const spies = {
        addProfileToDb: sinon.spy(),
        fetchAddressForPostcode: sinon.stub().returns(input.address),
        sendOrderConfirmationEmail: sinon.spy(),
        sendWelcomeEmail: sinon.stub().rejects(new Error()),
        submitOrderToRestaurant: sinon.stub().returns({ approximateDeliveryTime: defaultApproximateDeliveryTime })
      };

      const verifiedAddress = Object.assign({}, input.address, {
        hasItBeenVerified: true,
        line2: input.address.line2,
        line3: input.address.line3
      });

      const orderPizza = createAction({
        dataFlowSchema,
        foldStepResults,
        frontController,
        getConditions,
        getSteps: ({ stepResults }) => getSteps(Object.assign({ stepResults }, spies))
      });

      const approximateDeliveryTime = await orderPizza(input);

      expect(spies.addProfileToDb.notCalled).to.equal(true);

      expect(spies.fetchAddressForPostcode.calledWith({ postcode: input.address.postcode })).to.equal(true);

      expect(spies.sendOrderConfirmationEmail.calledWith({
        body: getOrderConfirmationEmailBody({ approximateDeliveryTime: defaultApproximateDeliveryTime }),
        email: input.email,
        subject: getOrderConfirmationEmailSubject()
      })).to.equal(true);

      expect(spies.sendWelcomeEmail.notCalled).to.equal(true);

      expect(spies.submitOrderToRestaurant.calledWith({
        address: verifiedAddress,
        email: input.email,
        items: input.orderedItems
      })).to.equal(true);

      expect(approximateDeliveryTime).to.equal(defaultApproximateDeliveryTime);
    });
  });

  describe('submit order and create a customer profile', () => {
    let input;

    before(() => {
      input = {
        address: {
          line1: 'Buckingham Palace',
          postcode: 'SW1A 1AA',
          town: 'London'
        },
        email: 'hello@glue.codes',
        firstName: 'Krzys',
        lastName: 'Czopp',
        orderedItems: [
          {
            id: 'somePizzaId',
            quantity: 1
          },
          {
            id: 'someSideId',
            quantity: 2
          }
        ],
        password: 'somePassword'
      };
    });

    it('no approximateDeliveryTime returned from restaurant', async () => {
      const verifiedAddress = Object.assign({}, input.address, {
        hasItBeenVerified: true,
        line2: input.address.line2,
        line3: input.address.line3
      });

      const spies = {
        addProfileToDb: sinon.spy(),
        fetchAddressForPostcode: sinon.stub().returns(input.address),
        sendOrderConfirmationEmail: sinon.spy(),
        sendWelcomeEmail: sinon.spy(),
        submitOrderToRestaurant: sinon.stub().returns({ approximateDeliveryTime: null })
      };

      const orderPizza = createAction({
        dataFlowSchema,
        foldStepResults,
        frontController,
        getConditions,
        getSteps: ({ stepResults }) => getSteps(Object.assign({ stepResults }, spies))
      });

      const approximateDeliveryTime = await orderPizza(input);

      expect(spies.addProfileToDb.calledWith({
        address: verifiedAddress,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        password: input.password
      })).to.equal(true);

      expect(spies.fetchAddressForPostcode.calledWith({ postcode: input.address.postcode })).to.equal(true);

      expect(spies.sendOrderConfirmationEmail.calledWith({
        body: getOrderConfirmationEmailBody({ approximateDeliveryTime: defaultApproximateDeliveryTime }),
        email: input.email,
        subject: getOrderConfirmationEmailSubject()
      })).to.equal(true);

      expect(spies.sendWelcomeEmail.calledWith({
        body: getWelcomeEmailBody({ firstName: input.firstName }),
        email: input.email,
        subject: getWelcomeEmailSubject()
      })).to.equal(true);

      expect(spies.submitOrderToRestaurant.calledWith({
        address: verifiedAddress,
        email: input.email,
        items: input.orderedItems
      })).to.equal(true);

      expect(approximateDeliveryTime).to.equal(defaultApproximateDeliveryTime);
    });

    it('approximateDeliveryTime given by restaurant', async () => {
      const restaurantApproximateDeliveryTime = '45 minutes';

      const verifiedAddress = Object.assign({}, input.address, {
        hasItBeenVerified: true,
        line2: input.address.line2,
        line3: input.address.line3
      });

      const spies = {
        addProfileToDb: sinon.spy(),
        fetchAddressForPostcode: sinon.stub().returns(input.address),
        sendOrderConfirmationEmail: sinon.spy(),
        sendWelcomeEmail: sinon.spy(),
        submitOrderToRestaurant: sinon.stub().returns({ approximateDeliveryTime: restaurantApproximateDeliveryTime })
      };

      const orderPizza = createAction({
        dataFlowSchema,
        foldStepResults,
        frontController,
        getConditions,
        getSteps: ({ stepResults }) => getSteps(Object.assign({ stepResults }, spies))
      });

      const approximateDeliveryTime = await orderPizza(input);

      expect(spies.addProfileToDb.calledWith({
        address: verifiedAddress,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        password: input.password
      })).to.equal(true);

      expect(spies.fetchAddressForPostcode.calledWith({ postcode: input.address.postcode })).to.equal(true);

      expect(spies.sendOrderConfirmationEmail.calledWith({
        body: getOrderConfirmationEmailBody({ approximateDeliveryTime: restaurantApproximateDeliveryTime }),
        email: input.email,
        subject: getOrderConfirmationEmailSubject()
      })).to.equal(true);

      expect(spies.sendWelcomeEmail.calledWith({
        body: getWelcomeEmailBody({ firstName: input.firstName }),
        email: input.email,
        subject: getWelcomeEmailSubject()
      })).to.equal(true);

      expect(spies.submitOrderToRestaurant.calledWith({
        address: verifiedAddress,
        email: input.email,
        items: input.orderedItems
      })).to.equal(true);

      expect(approximateDeliveryTime).to.equal(restaurantApproximateDeliveryTime);
    });

    it('fetchAddressForPostcode() returns null', async () => {
      const spies = {
        addProfileToDb: sinon.spy(),
        fetchAddressForPostcode: sinon.stub().returns(null),
        sendOrderConfirmationEmail: sinon.spy(),
        sendWelcomeEmail: sinon.spy(),
        submitOrderToRestaurant: sinon.stub().returns({ approximateDeliveryTime: defaultApproximateDeliveryTime })
      };

      const verifiedAddress = Object.assign({}, input.address, {
        hasItBeenVerified: false,
        line2: input.address.line2,
        line3: input.address.line3
      });

      const orderPizza = createAction({
        dataFlowSchema,
        foldStepResults,
        frontController,
        getConditions,
        getSteps: ({ stepResults }) => getSteps(Object.assign({ stepResults }, spies))
      });

      const approximateDeliveryTime = await orderPizza(input);

      expect(spies.addProfileToDb.calledWith({
        address: verifiedAddress,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        password: input.password
      })).to.equal(true);

      expect(spies.fetchAddressForPostcode.calledWith({ postcode: input.address.postcode })).to.equal(true);

      expect(spies.sendOrderConfirmationEmail.calledWith({
        body: getOrderConfirmationEmailBody({ approximateDeliveryTime: defaultApproximateDeliveryTime }),
        email: input.email,
        subject: getOrderConfirmationEmailSubject()
      })).to.equal(true);

      expect(spies.sendWelcomeEmail.calledWith({
        body: getWelcomeEmailBody({ firstName: input.firstName }),
        email: input.email,
        subject: getWelcomeEmailSubject()
      })).to.equal(true);

      expect(spies.submitOrderToRestaurant.calledWith({
        address: verifiedAddress,
        email: input.email,
        items: input.orderedItems
      })).to.equal(true);

      expect(approximateDeliveryTime).to.equal(defaultApproximateDeliveryTime);
    });

    it('fetchAddressForPostcode() rejects with an error', async () => {
      const spies = {
        addProfileToDb: sinon.spy(),
        fetchAddressForPostcode: sinon.stub().rejects(new Error()),
        sendOrderConfirmationEmail: sinon.spy(),
        sendWelcomeEmail: sinon.spy(),
        submitOrderToRestaurant: sinon.stub().returns({ approximateDeliveryTime: defaultApproximateDeliveryTime })
      };

      const verifiedAddress = Object.assign({}, input.address, {
        hasItBeenVerified: false,
        line2: input.address.line2,
        line3: input.address.line3
      });

      const orderPizza = createAction({
        dataFlowSchema,
        foldStepResults,
        frontController,
        getConditions,
        getSteps: ({ stepResults }) => getSteps(Object.assign({ stepResults }, spies))
      });

      const approximateDeliveryTime = await orderPizza(input);

      expect(spies.addProfileToDb.calledWith({
        address: verifiedAddress,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        password: input.password
      })).to.equal(true);

      expect(spies.fetchAddressForPostcode.calledWith({ postcode: input.address.postcode })).to.equal(true);

      expect(spies.sendOrderConfirmationEmail.calledWith({
        body: getOrderConfirmationEmailBody({ approximateDeliveryTime: defaultApproximateDeliveryTime }),
        email: input.email,
        subject: getOrderConfirmationEmailSubject()
      })).to.equal(true);

      expect(spies.sendWelcomeEmail.calledWith({
        body: getWelcomeEmailBody({ firstName: input.firstName }),
        email: input.email,
        subject: getWelcomeEmailSubject()
      })).to.equal(true);

      expect(spies.submitOrderToRestaurant.calledWith({
        address: verifiedAddress,
        email: input.email,
        items: input.orderedItems
      })).to.equal(true);

      expect(approximateDeliveryTime).to.equal(defaultApproximateDeliveryTime);
    });

    it('sendOrderConfirmationEmail() rejects with an error', async () => {
      const spies = {
        addProfileToDb: sinon.spy(),
        fetchAddressForPostcode: sinon.stub().returns(input.address),
        sendOrderConfirmationEmail: sinon.stub().rejects(new Error()),
        sendWelcomeEmail: sinon.spy(),
        submitOrderToRestaurant: sinon.stub().returns({ approximateDeliveryTime: defaultApproximateDeliveryTime })
      };

      const verifiedAddress = Object.assign({}, input.address, {
        hasItBeenVerified: true,
        line2: input.address.line2,
        line3: input.address.line3
      });

      const orderPizza = createAction({
        dataFlowSchema,
        foldStepResults,
        frontController,
        getConditions,
        getSteps: ({ stepResults }) => getSteps(Object.assign({ stepResults }, spies))
      });

      const approximateDeliveryTime = await orderPizza(input);

      expect(spies.addProfileToDb.calledWith({
        address: verifiedAddress,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        password: input.password
      })).to.equal(true);

      expect(spies.fetchAddressForPostcode.calledWith({ postcode: input.address.postcode })).to.equal(true);

      expect(spies.sendOrderConfirmationEmail.calledWith({
        body: getOrderConfirmationEmailBody({ approximateDeliveryTime: defaultApproximateDeliveryTime }),
        email: input.email,
        subject: getOrderConfirmationEmailSubject()
      })).to.equal(true);

      expect(spies.sendWelcomeEmail.calledWith({
        body: getWelcomeEmailBody({ firstName: input.firstName }),
        email: input.email,
        subject: getWelcomeEmailSubject()
      })).to.equal(true);

      expect(spies.submitOrderToRestaurant.calledWith({
        address: verifiedAddress,
        email: input.email,
        items: input.orderedItems
      })).to.equal(true);

      expect(approximateDeliveryTime).to.equal(defaultApproximateDeliveryTime);
    });

    it('sendWelcomeEmail() rejects with an error', async () => {
      const spies = {
        addProfileToDb: sinon.spy(),
        fetchAddressForPostcode: sinon.stub().returns(input.address),
        sendOrderConfirmationEmail: sinon.spy(),
        sendWelcomeEmail: sinon.stub().rejects(new Error()),
        submitOrderToRestaurant: sinon.stub().returns({ approximateDeliveryTime: defaultApproximateDeliveryTime })
      };

      const verifiedAddress = Object.assign({}, input.address, {
        hasItBeenVerified: true,
        line2: input.address.line2,
        line3: input.address.line3
      });

      const orderPizza = createAction({
        dataFlowSchema,
        foldStepResults,
        frontController,
        getConditions,
        getSteps: ({ stepResults }) => getSteps(Object.assign({ stepResults }, spies))
      });

      const approximateDeliveryTime = await orderPizza(input);

      expect(spies.addProfileToDb.calledWith({
        address: verifiedAddress,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        password: input.password
      })).to.equal(true);

      expect(spies.fetchAddressForPostcode.calledWith({ postcode: input.address.postcode })).to.equal(true);

      expect(spies.sendOrderConfirmationEmail.calledWith({
        body: getOrderConfirmationEmailBody({ approximateDeliveryTime: defaultApproximateDeliveryTime }),
        email: input.email,
        subject: getOrderConfirmationEmailSubject()
      })).to.equal(true);

      expect(spies.sendWelcomeEmail.calledWith({
        body: getWelcomeEmailBody({ firstName: input.firstName }),
        email: input.email,
        subject: getWelcomeEmailSubject()
      })).to.equal(true);

      expect(spies.submitOrderToRestaurant.calledWith({
        address: verifiedAddress,
        email: input.email,
        items: input.orderedItems
      })).to.equal(true);

      expect(approximateDeliveryTime).to.equal(defaultApproximateDeliveryTime);
    });
  });
});
