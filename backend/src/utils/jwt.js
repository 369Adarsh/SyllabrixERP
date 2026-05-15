const jwt = require('jsonwebtoken');
const config = require('../config/env');

const signToken = (payload) =>
  jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

const signRefreshToken = (payload) =>
  jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpiresIn });

const verifyToken = (token) => jwt.verify(token, config.jwtSecret);

const verifyRefreshToken = (token) => jwt.verify(token, config.jwtRefreshSecret);

module.exports = { signToken, signRefreshToken, verifyToken, verifyRefreshToken };
