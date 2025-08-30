const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { Pool } = require('pg');

// Connexion à la base via Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Route POST pour la création d'un nouveau rapport
router.post('/rapports', authMiddleware, async (req, res) => {
    try {
        // L'ID de l'utilisateur est maintenant disponible via le middleware d'authentification
        const userId = req.user.id;
        console.log('ID utilisateur authentifié:', userId);

        // Récupération des données du corps de la requête
        const { titre, contenu, categorie, type, accreditations } = req.body;

        // Validation des champs obligatoires
        if (!titre || !contenu || !categorie || !type) {
            return res.status(400).json({ message: 'Données de rapport incomplètes.' });
        }

        // Récupération de la division de l'utilisateur
        const userResult = await pool.query('SELECT division FROM users WHERE id_user = $1', [userId]);
        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        const userDivisionId = userResult.rows[0].division;

        // Logique conditionnelle pour les données de la base de données
        let reportDivision = null;
        let reportAccreditations = null;

        switch (categorie) {
            case 'division':
                reportDivision = userDivisionId;
                break;
            case 'accreditations':
                if (!accreditations || !Array.isArray(accreditations)) {
                    return res.status(400).json({ message: 'Les accréditations doivent être fournies sous forme de tableau.' });
                }
                reportAccreditations = accreditations;
                break;
            case 'publique':
                break;
            default:
                return res.status(400).json({ message: 'Catégorie de rapport invalide.' });
        }
        
        // Insertion des données dans la base de données
        const query = `
            INSERT INTO rapports (
                titre, 
                contenu, 
                categorie, 
                type, 
                id_createur, 
                division, 
                accreditations,
                brouillon
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;
        const values = [
            titre, 
            contenu, 
            categorie, 
            type, 
            userId, 
            reportDivision, 
            reportAccreditations, 
            false
        ];

        const newReport = await pool.query(query, values);

        // Réponse de succès
        res.status(201).json({ 
            message: 'Rapport créé avec succès.',
            report: newReport.rows[0]
        });

    } catch (error) {
        console.error('Erreur lors de la création du rapport:', error);
        res.status(500).json({ message: 'Erreur serveur interne.' });
    }
});

module.exports = router;