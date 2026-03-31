const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const config = require('../config/config');
const { User } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Nazwa użytkownika wymagana'),
    body('password').notEmpty().withMessage('Hasło wymagane'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, password } = req.body;

      const user = await User.findOne({ where: { username } });
      if (!user) {
        return res.status(401).json({ message: 'Nieprawidłowa nazwa użytkownika lub hasło' });
      }

      const isMatch = await bcryptjs.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Nieprawidłowa nazwa użytkownika lub hasło' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          imie: user.imie,
          nazwisko: user.nazwisko,
          role: user.role,
        },
      });
    } catch (err) {
      console.error('Błąd logowania:', err);
      res.status(500).json({ message: 'Błąd serwera' });
    }
  }
);

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
