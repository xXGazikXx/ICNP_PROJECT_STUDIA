const express = require('express');
const { body, validationResult } = require('express-validator');
const { Patient, User } = require('../models');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.use(auth);

// GET /api/patients
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }

    if (req.user.role === 'student') {
      where.created_by = req.user.id;
    }

    if (req.user.role === 'prowadzacy') {
      const studenci = await User.findAll({
        where: { prowadzacy_id: req.user.id },
        attributes: ['id'],
      });
      const ids = [req.user.id, ...studenci.map((s) => s.id)];
      where.created_by = ids;
    }

    const patients = await Patient.findAll({
      where,
      include: [
        {
          model: User,
          as: 'autor',
          attributes: ['id', 'imie', 'nazwisko', 'role'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(patients);
  } catch (err) {
    console.error('Błąd pobierania pacjentów:', err);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// POST /api/patients
router.post(
  '/',
  [
    body('imie').trim().notEmpty().withMessage('Imię wymagane'),
    body('nazwisko').trim().notEmpty().withMessage('Nazwisko wymagane'),
    body('pesel')
      .trim()
      .isLength({ min: 11, max: 11 })
      .withMessage('PESEL musi mieć 11 cyfr')
      .isNumeric()
      .withMessage('PESEL musi zawierać tylko cyfry'),
    body('lokalizacja').trim().optional(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { imie, nazwisko, pesel, lokalizacja } = req.body;

      const patient = await Patient.create({
        imie,
        nazwisko,
        pesel,
        lokalizacja: lokalizacja || null,
        status: 'aktualny',
        created_by: req.user.id,
      });

      res.status(201).json(patient);
    } catch (err) {
      console.error('Błąd dodawania pacjenta:', err);
      res.status(500).json({ message: 'Błąd serwera' });
    }
  }
);

// GET /api/patients/:id
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'autor',
          attributes: ['id', 'imie', 'nazwisko', 'role'],
        },
      ],
    });

    if (!patient) {
      return res.status(404).json({ message: 'Pacjent nie znaleziony' });
    }

    if (req.user.role === 'student' && patient.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    res.json(patient);
  } catch (err) {
    console.error('Błąd pobierania pacjenta:', err);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// PUT /api/patients/:id
router.put(
  '/:id',
  [
    body('imie').trim().optional().notEmpty(),
    body('nazwisko').trim().optional().notEmpty(),
    body('pesel').trim().optional().isLength({ min: 11, max: 11 }).isNumeric(),
    body('lokalizacja').trim().optional(),
    body('status').optional().isIn(['aktualny', 'wypisany', 'archiwum']),
  ],
  async (req, res) => {
    try {
      const patient = await Patient.findByPk(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: 'Pacjent nie znaleziony' });
      }

      if (req.user.role === 'student' && patient.created_by !== req.user.id) {
        return res.status(403).json({ message: 'Brak uprawnień' });
      }

      const { imie, nazwisko, pesel, lokalizacja, status } = req.body;
      await patient.update({
        ...(imie && { imie }),
        ...(nazwisko && { nazwisko }),
        ...(pesel && { pesel }),
        ...(lokalizacja !== undefined && { lokalizacja }),
        ...(status && { status }),
      });

      res.json(patient);
    } catch (err) {
      console.error('Błąd edycji pacjenta:', err);
      res.status(500).json({ message: 'Błąd serwera' });
    }
  }
);

// DELETE /api/patients/:id
router.delete('/:id', roleCheck('admin'), async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Pacjent nie znaleziony' });
    }

    await patient.destroy();
    res.json({ message: 'Pacjent usunięty' });
  } catch (err) {
    console.error('Błąd usuwania pacjenta:', err);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

module.exports = router;
