const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { Pool } = require('pg');

// Connexion à la base via Pool (comme ta route /profile)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});



router.get('/get_user_acre', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.identifiant; // Supposons que l'ID de l'utilisateur est stocké dans req.user.id après le middleware d'authentification.
    
    // 1. Récupérer la division et les accréditations de l'utilisateur
    const userResult = await pool.query(
      `SELECT division, niveau_accreditation FROM users WHERE identifiant = $1`,
      [userId]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    const userData = userResult.rows[0];
    const userDivision = userData.division;
    const userAcreds = userData.niveau_accreditation; // C'est le tableau d'entiers (int4)

    // Vérifier si le tableau d'accréditations est vide
    if (!userAcreds || userAcreds.length === 0) {
      return res.status(200).json([]); // Renvoyer un tableau vide si l'utilisateur n'a pas d'accréditations
    }

    // 2. Récupérer le nom de la table d'accréditation en fonction de la division
    const divisionResult = await pool.query(
      `SELECT table_acre FROM divisions WHERE id_div = $1`,
      [userDivision]
    );

    if (divisionResult.rowCount === 0) {
      return res.status(404).json({ message: "Division non trouvée." });
    }

    const tableName = divisionResult.rows[0].table_acre;

    // 3. Récupérer les libellés d'accréditation en utilisant le nom de la table
    // et le tableau d'IDs
    const acredsResult = await pool.query(
      `SELECT labelle_accre FROM ${tableName} WHERE id_accre = ANY($1)`,
      [userAcreds]
    );

    // Extraction des libellés dans un tableau simple pour la réponse
    const labels = acredsResult.rows.map(row => row.labelle_accre);

    res.status(200).json(labels);
  } catch (error) {
    console.error('Erreur DB:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});




router.get('/get_division_acre', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.identifiant; // Supposons que l'ID de l'utilisateur est stocké dans req.user.id après le middleware d'authentification.
    
    // 1. Récupérer la division et les accréditations de l'utilisateur
    const userResult = await pool.query(
      `SELECT division FROM users WHERE identifiant = $1`,
      [userId]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    const userData = userResult.rows[0];
    const userDivision = userData.division;

    // 2. Récupérer le nom de la table d'accréditation en fonction de la division
    const divisionResult = await pool.query(
      `SELECT table_acre FROM divisions WHERE id_div = $1`,
      [userDivision]
    );

    if (divisionResult.rowCount === 0) {
      return res.status(404).json({ message: "Division non trouvée." });
    }

    const tableName = divisionResult.rows[0].table_acre;

    // 3. Récupérer les libellés d'accréditation en utilisant le nom de la table
    // et le tableau d'IDs
    const acredsResult = await pool.query(
      `SELECT id_accre, labelle_accre FROM ${tableName}`
    );

    res.status(200).json(acredsResult.rows);
  } catch (error) {
    console.error('Erreur DB:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;