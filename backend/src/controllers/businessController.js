import { Business } from '../models/Business.js';

export const createBusiness = async (req, res) => {
    try {
        const business = await Business.create(req.body);
        
        res.status(201).json({
            status: 'success',
            data: business
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al crear el negocio',
            error: error.message
        });
    }
};

export const getBusinesses = async (req, res) => {
    try {
        const businesses = await Business.find();
        
        res.status(200).json({
            status: 'success',
            data: businesses
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener los negocios',
            error: error.message
        });
    }
};
