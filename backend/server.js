const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const { sequelize } = require('./models');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const userRoutes = require('./routes/users');

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/users', userRoutes);

// W produkcji serwuj frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Start serwera
async function start() {
  try {
    await sequelize.authenticate();
    console.log('Połączono z bazą danych MariaDB');

    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Tabele zsynchronizowane');

    app.listen(config.port, () => {
      console.log(`Serwer działa na porcie ${config.port}`);
    });
  } catch (err) {
    console.error('Nie udało się uruchomić serwera:', err);
    process.exit(1);
  }
}

start();
