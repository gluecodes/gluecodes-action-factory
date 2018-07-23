const fetchData = require('./reusables/fetch-data');
const postData = require('./reusables/post-data');
const persistProfile = require('./reusables/persist-profile');
const sendEmail = require('./reusables/send-email');

module.exports = ({
  stepResults,
  addProfileToDb = persistProfile,
  fetchAddressForPostcode = fetchData,
  sendOrderConfirmationEmail = sendEmail,
  sendWelcomeEmail = sendEmail,
  submitOrderToRestaurant = postData
}) => ({
  async findAddressByPostcode() {
    const { setInput: { address: { postcode } } } = stepResults;

    const fetchedAddress = await fetchAddressForPostcode({ postcode });
    const hasAddressBeenFound = !!fetchedAddress;

    if (!hasAddressBeenFound) { return null; }

    return {
      hasItBeenVerified: true,
      line1: fetchedAddress.line1,
      line2: fetchedAddress.line2,
      line3: fetchedAddress.line3,
      postcode: fetchedAddress.postcode,
      town: fetchedAddress.town
    };
  },
  async notifyRestaurant() {
    const {
      setInput: {
        email,
        orderedItems
      },
      refineCustomerAddress
    } = stepResults;

    const refinedCustomerAddress = refineCustomerAddress;

    const { approximateDeliveryTime = null } = await submitOrderToRestaurant({
      address: refinedCustomerAddress,
      email,
      items: orderedItems
    }) || {};

    return approximateDeliveryTime;
  },
  refineCustomerAddress() {
    const {
      setInput: { address },
      findAddressByPostcode
    } = stepResults;

    const fetchedAddress = findAddressByPostcode;

    return fetchedAddress.hasItBeenVerified ? fetchedAddress : address;
  },
  async saveProfile() {
    const {
      setInput: {
        email,
        firstName,
        lastName,
        password
      },
      refineCustomerAddress
    } = stepResults;

    const refinedCustomerAddress = refineCustomerAddress;

    return addProfileToDb({
      address: refinedCustomerAddress,
      email,
      firstName,
      lastName,
      password
    });
  },
  async sendOrderConfirmationEmail() {
    const {
      setInput: { email },
      notifyRestaurant
    } = stepResults;

    const aproximateDeliveryTime = notifyRestaurant;

    return sendOrderConfirmationEmail({
      body: `Your pizza will be delivered approximately in ${aproximateDeliveryTime}`,
      email,
      subject: 'Your order is on its way'
    });
  },
  async sendWelcomeEmail() {
    const {
      setInput: {
        email,
        firstName
      }
    } = stepResults;

    return sendWelcomeEmail({
      body: `Hello ${firstName}, your profile has been created`,
      email,
      subject: 'Greetings from GlueCodes'
    });
  }
});
