const reportError = require('./reusables/report-error');

module.exports = async ({
  steps: {
    findAddressByPostcode,
    notifyRestaurant,
    refineCustomerAddress,
    saveProfile,
    sendOrderConfirmationEmail,
    sendWelcomeEmail
  },
  conditions: {
    shouldCustomerProfileBeSaved
  }
}) => {
  try {
    await findAddressByPostcode();
  } catch (err) { // no matter whether it fails, report error and continue
    reportError(err);
  }

  refineCustomerAddress();

  if (shouldCustomerProfileBeSaved()) {
    await saveProfile();

    try {
      await sendWelcomeEmail();
    } catch (err) { // suppose the email can be re-sent by an external queue and continue
      reportError(err);
    }
  }

  await notifyRestaurant();

  try {
    await sendOrderConfirmationEmail();
  } catch (err) { // suppose the email can be re-sent by an external queue and continue
    reportError(err);
  }
};
