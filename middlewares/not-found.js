// This module exports a function that handles requests for non-existent routes
module.exports = (req, res) => res.status(404).send('Route does not exist');
