const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { Pool } = require('pg');

// Pool PostgreSQL (même config que dans index.js)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// POST /api/login
router.post('/login', async (req, res) => {
  const { identifiant, password } = req.body;

  try {
    // Récupère l'utilisateur avec l'identifiant
    const result = await pool.query('SELECT * FROM users WHERE identifiant = $1 LIMIT 1', [identifiant]);

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    }

    // Compare les mots de passe
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    }

    // Connexion réussie
    res.status(200).json({ message: 'Connexion réussie', userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
