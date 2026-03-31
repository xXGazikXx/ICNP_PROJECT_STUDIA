const bcryptjs = require('bcryptjs');
const { User } = require('../models');

async function seedAdmin() {
  try {
    const { sequelize } = require('../models');
    await sequelize.sync();

    const existing = await User.findOne({ where: { username: 'admin' } });
    if (existing) {
      console.log('Admin już istnieje.');
      process.exit(0);
    }

    const hashedPassword = await bcryptjs.hash('admin123', 12);
    await User.create({
      username: 'admin',
      password: hashedPassword,
      imie: 'Administrator',
      nazwisko: 'Systemu',
      email: 'admin@icnp.local',
      role: 'admin',
    });

    console.log('Konto admin utworzone (login: admin, hasło: admin123)');
    process.exit(0);
  } catch (err) {
    console.error('Błąd seedera:', err);
    process.exit(1);
  }
}

seedAdmin();
