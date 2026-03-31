const express = require('express');
const bcryptjs = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.use(auth);

// GET /api/users
router.get('/', roleCheck('admin', 'prowadzacy'), async (req, res) => {
  try {
    const where = {};

    if (req.user.role === 'prowadzacy') {
      where.prowadzacy_id = req.user.id;
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      include: [
        {
          model: User,
          as: 'prowadzacy',
          attributes: ['id', 'imie', 'nazwisko'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(users);
  } catch (err) {
    console.error('Błąd pobierania użytkowników:', err);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// POST /api/users
router.post(
  '/',
  roleCheck('admin'),
  [
    body('username').trim().notEmpty().withMessage('Nazwa użytkownika wymagana'),
    body('password').isLength({ min: 6 }).withMessage('Hasło min. 6 znaków'),
    body('imie').trim().notEmpty().withMessage('Imię wymagane'),
    body('nazwisko').trim().notEmpty().withMessage('Nazwisko wymagane'),
    body('role').isIn(['admin', 'prowadzacy', 'student']).withMessage('Nieprawidłowa rola'),
    body('prowadzacy_id').optional().isInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, password, imie, nazwisko, email, role, prowadzacy_id } = req.body;

      const existing = await User.findOne({ where: { username } });
      if (existing) {
        return res.status(400).json({ message: 'Nazwa użytkownika już zajęta' });
      }

      const hashedPassword = await bcryptjs.hash(password, 12);

      const user = await User.create({
        username,
        password: hashedPassword,
        imie,
        nazwisko,
        email: email || null,
        role,
        prowadzacy_id: prowadzacy_id || null,
      });

      const { password: _, ...userData } = user.toJSON();
      res.status(201).json(userData);
    } catch (err) {
      console.error('Błąd tworzenia użytkownika:', err);
      res.status(500).json({ message: 'Błąd serwera' });
    }
  }
);

// DELETE /api/users/:id
router.delete('/:id', roleCheck('admin'), async (req, res) => {
  try {
    if (parseInt(req.params.id, 10) === req.user.id) {
      return res.status(400).json({ message: 'Nie można usunąć samego siebie' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    }

    await user.destroy();
    res.json({ message: 'Użytkownik usunięty' });
  } catch (err) {
    console.error('Błąd usuwania użytkownika:', err);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

module.exports = router;
