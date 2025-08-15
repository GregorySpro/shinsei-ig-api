require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(express.json());

app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users'); // adapte selon ta table
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    console.log('DATABASE_URL =', process.env.DATABASE_URL);
    res.status(500).send('Erreur serveur');
  }
});

const registerRoute = require('./routes/register');
app.use('/api', registerRoute);

const loginRoute = require('./routes/login');
app.use('/api', loginRoute);

const profileRoute = require('./routes/profile');
app.use('/api', profileRoute);

// Ajout de la nouvelle route pour l'enregistrement d'un Aspirant
const registerAspirantRoute = require('./routes/register_aspirant');
app.use('/api', registerAspirantRoute); // La route sera disponible à /api/register_aspirant

app.listen(port, () => {
  console.log(`API en écoute sur le port ${port}`);
});