const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db'); // Assurez-vous que le chemin est correct vers votre fichier de connexion à la base de données.

// Route pour la création d'un nouveau rapport
router.post('/rapports', async (req, res) => {
    try {
        // Déchiffrement et validation du token JWT
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Token non fourni.' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Récupération et validation des données du corps de la requête
        const { titre, contenu, categorie, type, accreditations } = req.body;
        if (!titre || !contenu || !categorie || !type) {
            return res.status(400).json({ message: 'Données de rapport incomplètes.' });
        }

        // Récupération de la division de l'utilisateur
        const userResult = await db.query('SELECT division FROM users WHERE id = $1', [userId]);
        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        const userDivisionId = userResult.rows[0].division;

        // Logique conditionnelle pour les données
        let reportDivision = null;
        let reportAccreditations = null;

        switch (categorie) {
            case 'division':
                reportDivision = userDivisionId;
                break;
            case 'accreditations':
                if (!accreditations || !Array.isArray(accreditations)) {
                    return res.status(400).json({ message: 'Les accréditations doivent être un tableau.' });
                }
                reportAccreditations = accreditations;
                break;
            case 'publique':
                break;
            default:
                return res.status(400).json({ message: 'Catégorie de rapport invalide.' });
        }

        // Insertion des données dans la base de données
        const insertQuery = `
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

        const newReport = await db.query(insertQuery, values);

        res.status(201).json({ 
            message: 'Rapport créé avec succès.',
            report: newReport.rows[0]
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token invalide.' });
        }
        console.error('Erreur lors de la création du rapport:', error);
        res.status(500).json({ message: 'Erreur serveur interne.' });
    }
});

module.exports = router;