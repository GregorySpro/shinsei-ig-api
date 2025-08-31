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
        // Récupération de l'identifiant via le middleware d'authentification
        const userIdentifiant = req.user.identifiant;
        console.log('Identifiant utilisateur authentifié:', userIdentifiant);
        console.log('Corps de la requête:', req.user);

        // Récupération des données du corps de la requête
        const { titre, contenu, categorie, type, accreditations } = req.body;

        // Validation des champs obligatoires
        if (!titre || !contenu || !categorie || !type) {
            return res.status(400).json({ message: 'Données de rapport incomplètes.' });
        }

        // Étape 1: Récupérer l'id_user ET la division de l'utilisateur avec l'identifiant
        const userResult = await pool.query('SELECT id_user, division FROM users WHERE identifiant = $1', [userIdentifiant]);
        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        const userId = userResult.rows[0].id_user;
        const userDivisionId = userResult.rows[0].division;

        console.log('ID utilisateur pour DB:', userId);
        console.log('ID de la division:', userDivisionId);


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

        // Insertion des données dans la base de données avec l'id_user
        const query = `
                        INSERT INTO rapports (
                            titre,
                            contenu,
                            categorie,
                            type,
                            id_createur,
                            division,
                            destinataires,
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
            userId, // Correction ici : On utilise l'id_user
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

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Nouvelle route GET pour récupérer les rapports publics
router.get('/publics', authMiddleware, async (req, res) => {
    try {
        const query = `
            SELECT
                r.id_rapport,
                r.titre,
                r.contenu,
                r.type,
                r.id_createur,
                u.prenom,
                u.nom
            FROM
                rapports AS r
            LEFT JOIN
                users AS u ON r.id_createur = u.id_user
            WHERE
                r.categorie = 'publique';
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des rapports publics :', error);
        res.status(500).json({
            message: 'Erreur serveur lors de la récupération des rapports.',
            error: error.message
        });
    }
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Nouvelle route GET pour récupérer les rapports de la division de l'utilisateur
// Utilisation du middleware d'authentification pour obtenir l'ID utilisateur
router.get('/division', authMiddleware, async (req, res) => {
    try {
        // L'ID de l'utilisateur est accessible via req.user grâce à authMiddleware
        const userIdentifiant = req.user.identifiant;

        // Étape 1: Récupérer la division de l'utilisateur
        const userResult = await pool.query('SELECT division FROM users WHERE identifiant = $1', [userIdentifiant]);
        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: 'Division de l\'utilisateur non trouvée.' });
        }
        const userDivision = userResult.rows[0].division;

        // Étape 2: Récupérer les rapports de la catégorie 'division' pour la division de l'utilisateur
        const query = `
            SELECT
                r.id_rapport,
                r.titre,
                r.contenu,
                r.type,
                r.id_createur,
                r.categorie,
                r.division,
                u.prenom,
                u.nom
            FROM
                rapports AS r
            LEFT JOIN
                users AS u ON r.id_createur = u.id_user
            WHERE
                r.categorie = 'division' AND r.division = $1;
        `;
        const { rows } = await pool.query(query, [userDivision]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des rapports de division :', error);
        res.status(500).json({
            message: 'Erreur serveur lors de la récupération des rapports de division.',
            error: error.message
        });
    }
});


module.exports = router;