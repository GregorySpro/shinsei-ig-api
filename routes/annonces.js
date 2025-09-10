const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { Pool } = require('pg');

// Connexion à la base via Pool (comme ta route /profile)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

router.get('/simple', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.titre_annonce,
        a.content_annonce,
        a.date,
        a.heure,
        u.prenom,
        u.nom
      FROM annonces a
      JOIN users u ON a.userid = u.id_user
      WHERE a.type_annonce = 'simple'
      ORDER BY a.date DESC, a.heure DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erreur DB complète:', error); // <== ici
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/global', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.titre_annonce,
        a.content_annonce,
        a.date,
        a.heure,
        u.prenom,
        u.nom
      FROM annonces a
      JOIN users u ON a.userid = u.id_user
      WHERE a.type_annonce = 'global'
      ORDER BY a.date DESC, a.heure DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erreur DB complète:', error); // <== ici
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/all', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.titre_annonce,
        a.content_annonce,
        a.date,
        a.heure,
        u.prenom,
        u.nom
      FROM annonces a
      JOIN users u ON a.userid = u.id_user
      ORDER BY a.date DESC, a.heure DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erreur DB complète:', error); // <== ici
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/division', authMiddleware, async (req, res) => {
    try {
        const identifiant = req.user.identifiant;

        // Étape 1: Récupérer l'ID de la division de l'utilisateur
        const userDivisionResult = await pool.query(
            'SELECT division FROM users WHERE identifiant = $1',
            [identifiant]
        );

        if (userDivisionResult.rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        const userDivisionId = userDivisionResult.rows[0].division;
        console.log('userDivisionId:', userDivisionId); // Pour déboguer (n'est pas le problème)

        // Étape 2: Récupérer le labelle de la division
        const divisionLabelResult = await pool.query(
            'SELECT labelle_division FROM divisions WHERE id_div = $1',
            [userDivisionId]
        );
        console.log('divisionLabelResult:', divisionLabelResult); // Pour déboguer

        if (divisionLabelResult.rows.length === 0) {
            // Gérer le cas où l'ID de la division ne correspond à aucun labelle
            return res.status(404).json({ message: 'Division non trouvée' });
        }
        
        const divisionLabel = divisionLabelResult.rows[0].labelle_division;

        // Étape 3: Récupérer les annonces de la division
        const annoncesResult = await pool.query(`
            SELECT 
                a.titre_annonce,
                a.content_annonce,
                a.division,
                a.date,
                a.heure,
                u.prenom,
                u.nom
            FROM annonces a
            JOIN users u ON a.userid = u.id_user
            WHERE a.type_annonce = 'division' AND a.division = $1
            ORDER BY a.date DESC, a.heure DESC
        `, [userDivisionId]);

        // Étape 4: Construire et envoyer la réponse
        // On inclut le labelle de la division en plus du tableau d'annonces
        res.status(200).json({
            labelle_division: divisionLabel,
            annonces: annoncesResult.rows
        });

    } catch (error) {
        console.error('Erreur DB complète:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

router.get('/division/last/:id', authMiddleware, async (req, res) => {
    try {
        const divisionId = req.params.id;
        console.log('divisionId:', divisionId); // Pour déboguer
        const result = await pool.query(`
            SELECT 
                a.titre_annonce,
                a.content_annonce,
                a.division,
                a.date,
                a.heure,
                u.prenom,
                u.nom
            FROM annonces a
            JOIN users u ON a.userid = u.id_user
            WHERE a.type_annonce = 'division' AND a.division = $1
            ORDER BY a.date DESC, a.heure DESC
            LIMIT 1
        `, [divisionId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erreur DB complète:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    } 
});
                


module.exports = router;
