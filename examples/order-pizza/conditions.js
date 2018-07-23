module.exports = ({ stepResults }) => ({
  shouldCustomerProfileBeSaved() {
    const {
      setInput: {
        firstName,
        lastName,
        password
      }
    } = stepResults;

    return typeof firstName !== 'undefined'
      && typeof lastName !== 'undefined'
      && typeof password !== 'undefined';
  }
});
