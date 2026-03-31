const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Brak tokenu autoryzacji' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(401).json({ message: 'Użytkownik nie istnieje' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Nieprawidłowy token' });
  }
};

module.exports = auth;
