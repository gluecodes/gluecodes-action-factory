const { createAction } = require('../index');

const orderPizza = createAction({
  dataFlowSchema: {
    getResult: require('./order-pizza/schemas/get-result.json'),
    setInput: require('./order-pizza/schemas/set-input'),
    findAddressByPostcode: require('./order-pizza/schemas/find-address-by-postcode'),
    notifyRestaurant: require('./order-pizza/schemas/notify-restaurant.json'),
    refineCustomerAddress: require('./order-pizza/schemas/refine-customer-address'),
    saveProfile: require('./order-pizza/schemas/save-profile.json'),
    sendOrderConfirmationEmail: require('./order-pizza/schemas/send-order-confirmation-email.json'),
    sendWelcomeEmail: require('./order-pizza/schemas/send-welcome-email.json')
  },
  foldStepResults: require('./order-pizza/fold-step-results'),
  frontController: require('./order-pizza/index'),
  getSteps: require('./order-pizza/steps'),
  getConditions: require('./order-pizza/conditions')
});

module.exports = {
  orderPizza
};
