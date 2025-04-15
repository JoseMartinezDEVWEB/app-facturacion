// controllers/clienteController.js
import Cliente  from '../models/Cliente.js';
import asyncHandler from 'express-async-handler';

// @desc    Registrar un nuevo cliente
// @route   POST /api/clientes
// @access  Public
export const registerCliente = asyncHandler(async (req, res) => {
  const { name, email, phone, role, address, credito } = req.body;

  // Crear cliente
  const cliente = await Cliente.create({
    name,
    email,
    phone,
    role,
    address,
    credito
  });

  if (cliente) {
    res.status(201).json({
      _id: cliente._id,
      name: cliente.name,
      email: cliente.email,
      phone: cliente.phone,
      role: cliente.role,
      address: cliente.address,
      credito: cliente.credito,
      cuentasPendientes: cliente.cuentasPendientes,
      cuentasVendidas: cliente.cuentasVendidas
    });
  } else {
    res.status(400);
    throw new Error('Datos de cliente inválidos');
  }
});

// @desc    Obtener todos los clientes
// @route   GET /api/clientes
// @access  Public
export const getClientes = asyncHandler(async (req, res) => {
  const clientes = await Cliente.find({});
  res.json(clientes);
});


// @desc    Actualizar un cliente
// @route   PUT /api/clientes/:id
// @access  Public
export const updateCliente = asyncHandler(async (req, res) => {
  const cliente = await Cliente.findById(req.params.id);

  if (cliente) {
    cliente.name = req.body.name || cliente.name;
    cliente.email = req.body.email || cliente.email;
    cliente.phone = req.body.phone || cliente.phone;
    cliente.role = req.body.role || cliente.role;
    cliente.address = req.body.address || cliente.address;
    cliente.credito = req.body.credito !== undefined ? req.body.credito : cliente.credito;
    cliente.cuentasPendientes = req.body.cuentasPendientes !== undefined ? req.body.cuentasPendientes : cliente.cuentasPendientes;
    cliente.cuentasVendidas = req.body.cuentasVendidas !== undefined ? req.body.cuentasVendidas : cliente.cuentasVendidas;

    const updatedCliente = await cliente.save();

    res.json({
      _id: updatedCliente._id,
      name: updatedCliente.name,
      email: updatedCliente.email,
      phone: updatedCliente.phone,
      role: updatedCliente.role,
      address: updatedCliente.address,
      credito: updatedCliente.credito,
      cuentasPendientes: updatedCliente.cuentasPendientes,
      cuentasVendidas: updatedCliente.cuentasVendidas
    });
  } else {
    res.status(404);
    throw new Error('Cliente no encontrado');
  }
});

// @desc    Eliminar un cliente
// @route   DELETE /api/clientes/:id
// @access  Public
export const deleteCliente = asyncHandler(async (req, res) => {
  const cliente = await Cliente.findById(req.params.id);

  if (cliente) {
    await cliente.deleteOne();
    res.json({ message: 'Cliente eliminado' });
  } else {
    res.status(404);
    throw new Error('Cliente no encontrado');
  }
});

// @desc    Obtener estadísticas de clientes
// @route   GET /api/clientes/stats
// @access  Private
export const getClientesStats = asyncHandler(async (req, res) => {
  try {
    // Contar total de clientes (solo tipo 'cliente', no proveedores o socios)
    const totalClientes = await Cliente.countDocuments({ role: 'cliente' });

    // Obtener suma de cuentas pendientes
    const clientesDeuda = await Cliente.aggregate([
      { $match: { role: 'cliente' } },
      { $group: {
          _id: null,
          cuentasPendientes: { $sum: '$cuentasPendientes' },
          cuentasVendidas: { $sum: '$cuentasVendidas' },
          // Contar clientes con deuda pendiente
          totalPendientesCount: {
            $sum: { $cond: [{ $gt: ['$cuentasPendientes', 0] }, 1, 0] }
          }
        }
      }
    ]);

    // Valores por defecto en caso de que no haya datos
    const stats = clientesDeuda[0] || { 
      cuentasPendientes: 0, 
      cuentasVendidas: 0,
      totalPendientesCount: 0
    };

    res.status(200).json({
      success: true,
      totalClientes,
      cuentasPendientes: stats.cuentasPendientes,
      cuentasVendidas: stats.cuentasVendidas,
      totalPendientesCount: stats.totalPendientesCount
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de clientes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas de clientes' 
    });
  }
});

// @desc    Buscar clientes
// @route   GET /api/clientes/search
// @access  Private
export const searchClientes = asyncHandler(async (req, res) => {
  const { term } = req.query;

  if (!term || term.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Por favor proporcione al menos 2 caracteres para la búsqueda'
    });
  }

  // Buscar por nombre, teléfono, email o RNC/cédula
  const clientes = await Cliente.find({
    $or: [
      { name: { $regex: term, $options: 'i' } },
      { phone: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
      { rncCedula: { $regex: term, $options: 'i' } }
    ],
    // Solo clientes, no proveedores
    role: 'cliente'
  }).limit(10);

  res.status(200).json({
    success: true,
    clientes
  });
});

// @desc    Crear nuevo cliente
// @route   POST /api/clientes
// @access  Private
export const createCliente = asyncHandler(async (req, res) => {
  const { name, phone, email, rncCedula, address } = req.body;

  // Validar datos requeridos
  if (!name || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Nombre y teléfono son campos obligatorios'
    });
  }

  try {
    // Verificar si el cliente ya existe
    const clienteExistente = await Cliente.findOne({
      $or: [
        { phone },
        ...(rncCedula ? [{ rncCedula }] : []),
        ...(email ? [{ email }] : [])
      ]
    });

    if (clienteExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un cliente con este teléfono, email o RNC/cédula'
      });
    }

    // Crear nuevo cliente
    const nuevoCliente = await Cliente.create({
      name,
      phone,
      email,
      rncCedula,
      address,
      role: 'cliente',
      // Si hay un usuario en la sesión
      ...(req.user && { createdBy: req.user._id })
    });

    res.status(201).json({
      success: true,
      message: 'Cliente creado correctamente',
      cliente: nuevoCliente
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cliente'
    });
  }
});

// @desc    Obtener un cliente específico
// @route   GET /api/clientes/:id
// @access  Private
export const getClienteById = asyncHandler(async (req, res) => {
  const cliente = await Cliente.findById(req.params.id);

  if (!cliente) {
    return res.status(404).json({
      success: false,
      message: 'Cliente no encontrado'
    });
  }

  res.status(200).json({
    success: true,
    cliente
  });
});

// @desc    Obtener clientes con deudas pendientes
// @route   GET /api/clientes/deudas
// @access  Private
export const getClientesDeuda = asyncHandler(async (req, res) => {
  try {
    // Buscar clientes con cuentas pendientes mayores que 0
    const clientesConDeuda = await Cliente.find({
      cuentasPendientes: { $gt: 0 },
      role: 'cliente'
    }).select('name cuentasPendientes');

    // Añadir el número de facturas pendientes
    // En un caso real, esto se obtendría de una relación con las facturas
    const clientesConFacturas = clientesConDeuda.map(cliente => {
      // Calcular un número aproximado de facturas basado en la deuda
      // (En producción, esto debería venir de una consulta real a la tabla de facturas)
      const facturasPendientes = Math.max(1, Math.round(cliente.cuentasPendientes / 200));
      
      return {
        id: cliente._id,
        nombre: cliente.name,
        totalDeuda: cliente.cuentasPendientes,
        facturasPendientes
      };
    });

    res.status(200).json({
      success: true,
      clientes: clientesConFacturas
    });
  } catch (error) {
    console.error('Error al obtener clientes con deuda:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener clientes con deuda'
    });
  }
});

// @desc    Saldar deuda completa de un cliente
// @route   POST /api/clientes/saldar-deuda
// @access  Private
export const saldarDeuda = asyncHandler(async (req, res) => {
  const { clienteId } = req.body;

  if (!clienteId) {
    return res.status(400).json({
      success: false,
      message: 'El ID del cliente es requerido'
    });
  }

  try {
    // Buscar el cliente
    const cliente = await Cliente.findById(clienteId);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Obtener el monto total de la deuda antes de saldarla
    const montoDeuda = cliente.cuentasPendientes;

    // Transferir la deuda pendiente a cuentas vendidas
    cliente.cuentasVendidas += cliente.cuentasPendientes;
    cliente.cuentasPendientes = 0;

    // Guardar los cambios
    await cliente.save();

    // Aquí se podrían registrar los movimientos en un historial de pagos
    // ...

    res.status(200).json({
      success: true,
      message: 'Deuda saldada correctamente',
      clienteId: cliente._id,
      montoSaldado: montoDeuda
    });
  } catch (error) {
    console.error('Error al saldar deuda:', error);
    res.status(500).json({
      success: false,
      message: 'Error al saldar deuda'
    });
  }
});

// @desc    Abonar a la deuda de un cliente
// @route   POST /api/clientes/abonar-deuda
// @access  Private
export const abonarDeuda = asyncHandler(async (req, res) => {
  const { clienteId, montoAbono } = req.body;

  if (!clienteId || !montoAbono) {
    return res.status(400).json({
      success: false,
      message: 'El ID del cliente y monto de abono son requeridos'
    });
  }

  // Validar que el monto sea un número y mayor que 0
  const montoNumerico = parseFloat(montoAbono);
  if (isNaN(montoNumerico) || montoNumerico <= 0) {
    return res.status(400).json({
      success: false,
      message: 'El monto debe ser un número válido mayor que cero'
    });
  }

  try {
    // Buscar el cliente
    const cliente = await Cliente.findById(clienteId);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Validar que el abono no sea mayor que la deuda
    if (montoNumerico > cliente.cuentasPendientes) {
      return res.status(400).json({
        success: false,
        message: 'El monto de abono no puede ser mayor que la deuda total'
      });
    }

    // Realizar el abono
    cliente.cuentasPendientes -= montoNumerico;
    cliente.cuentasVendidas += montoNumerico;

    // Guardar los cambios
    await cliente.save();

    // Aquí se podrían registrar los movimientos en un historial de pagos
    // ...

    res.status(200).json({
      success: true,
      message: 'Abono realizado correctamente',
      clienteId: cliente._id,
      montoAbonado: montoNumerico,
      nuevaDeuda: cliente.cuentasPendientes
    });
  } catch (error) {
    console.error('Error al abonar a deuda:', error);
    res.status(500).json({
      success: false,
      message: 'Error al abonar a deuda'
    });
  }
});

// Exportar todos los controladores
export default {
  getClientesStats,
  searchClientes,
  createCliente,
  getClienteById
};