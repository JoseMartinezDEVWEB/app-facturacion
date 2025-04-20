import Business from '../models/businessModel.js';

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

// Obtener información del negocio (configuración)
export const getBusinessInfo = async (req, res) => {
    try {
        // Buscar el primer negocio (asumiendo que solo hay uno configurado)
        const business = await Business.findOne();
        
        if (!business) {
            return res.status(200).json({
                success: true,
                message: 'No hay información del negocio configurada',
                data: null
            });
        }
        
        res.status(200).json({
            success: true,
            data: {
                name: business.name,
                taxId: business.taxId,
                address: business.address,
                phone: business.phone,
                email: business.email,
                website: business.website || '',
                logo: business.logo || null
            }
        });
    } catch (error) {
        console.error('Error al obtener información del negocio:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener información del negocio',
            error: error.message
        });
    }
};

// Guardar información del negocio (configuración)
export const saveBusinessInfo = async (req, res) => {
    try {
        const { name, taxId, address, phone, email, website } = req.body;
        
        // Verificar campos requeridos
        if (!name || !taxId || !address || !phone || !email) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos obligatorios deben ser completados'
            });
        }
        
        // Manejar archivo de logo si existe
        let logoPath = null;
        if (req.file) {
            logoPath = `/uploads/business/${req.file.filename}`;
        }
        
        // Buscar si ya existe un negocio
        let business = await Business.findOne();
        
        if (business) {
            // Actualizar negocio existente
            business.name = name;
            business.taxId = taxId;
            business.address = address;
            business.phone = phone;
            business.email = email;
            business.website = website || '';
            
            // Solo actualizar logo si se proporcionó uno nuevo
            if (logoPath) {
                business.logo = logoPath;
            }
            
            await business.save();
        } else {
            // Crear nuevo negocio
            business = await Business.create({
                name,
                taxId,
                address,
                phone,
                email,
                website: website || '',
                logo: logoPath
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Información del negocio guardada con éxito',
            data: {
                name: business.name,
                taxId: business.taxId,
                address: business.address,
                phone: business.phone,
                email: business.email,
                website: business.website || '',
                logo: business.logo
            }
        });
    } catch (error) {
        console.error('Error al guardar información del negocio:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar información del negocio',
            error: error.message
        });
    }
};

export const createOrUpdateBusiness = async (req, res) => {
  try {
    const { name, taxId, address, phone, email, website, comments } = req.body;
    let logo = '';

    // Si se proporcionó un archivo de logo
    if (req.file) {
      logo = req.file.path;
    }

    // Buscar si ya existe un negocio (solo debe haber uno en el sistema)
    let business = await Business.findOne();

    if (business) {
      // Actualizar el negocio existente
      business.name = name;
      business.taxId = taxId;
      business.address = address;
      business.phone = phone;
      business.email = email;
      business.website = website;
      business.comments = comments;
      
      // Solo actualizar el logo si se proporcionó uno nuevo
      if (logo) {
        business.logo = logo;
      }

      await business.save();
    } else {
      // Crear un nuevo negocio
      business = new Business({
        name,
        taxId,
        address,
        phone,
        email,
        website,
        comments,
        logo
      });

      await business.save();
    }

    res.status(200).json({
      success: true,
      data: business,
      message: 'Información del negocio guardada exitosamente'
    });
  } catch (error) {
    console.error('Error en createOrUpdateBusiness:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar la información del negocio',
      error: error.message
    });
  }
};
