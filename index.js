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

// Ajout de la nouvelle route pour l'enregistrement d'un Aspirant
const registerAspirantRoute = require('./routes/register_aspirant');
app.use('/api', registerAspirantRoute); // La route sera disponible à /api/register_aspirant

const annoncesRoutes = require('./routes/annonces');
app.use('/annonces', annoncesRoutes); //récupère les annonces

const aspirantRoutes = require('./routes/aspirant');
app.use('/api', aspirantRoutes);  // <-- Ajout de la route aspirant

const divisionsRoutes = require('./routes/divisions');
app.use('/api', divisionsRoutes);  // <-- Récupère les noms et descriptions des divisions pour les aspirants register

const rapportRoute = require('./routes/rapports');
app.use('/rapports', rapportRoute); // <-- Route pour créer et récupérer les rapports

const acreditationsRoute = require('./routes/acreditations');
app.use('/acreditations', acreditationsRoute);

const academieRoute = require('./routes/academie');
app.use('/api', academieRoute); // <-- Route pour les fonctionnalités de l'académie

app.listen(port, () => {
  console.log(`API en écoute sur le port ${port}`);
});