// Secrets stay in this Node function, never in the CRA/browser environment.
module.exports = require('../server/usage.cjs').createUsageHandler();
