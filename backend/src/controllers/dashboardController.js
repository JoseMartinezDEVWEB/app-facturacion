// controllers/dashboardController.js
import { newInvoice } from '../models/newInvoice.js';
import Expense from '../models/Expense.js';
import Cliente from '../models/Cliente.js';
import { Product } from '../models/Product.js';
import asyncHandler from 'express-async-handler';

// @desc    Obtener datos para el dashboard
// @route   GET /api/dashboard/data
// @access  Private
export const getDashboardData = asyncHandler(async (req, res) => {
  try {
    // Obtener período de consulta (hoy, esta semana, este mes, etc.)
    const { period = 'today', productsLimit = 5 } = req.query;
    
    // Definir fechas de inicio y fin según el período
    const today = new Date();
    let startDate, endDate;
    
    endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
      case 'today':
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
    }

    // Obtener ventas del período, EXCLUYENDO facturas fiadas/pendientes
    const ventasConfirmadas = await newInvoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          // No incluir facturas fiadas/pendientes
          $or: [
            { isCredit: { $ne: true } },  // No es compra fiada
            { creditStatus: 'paid' }      // O está marcada como pagada
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalVentas: { $sum: '$total' },
          totalFacturas: { $sum: 1 }
        }
      }
    ]);

    // Obtener facturas fiadas/pendientes del período
    const ventasPendientes = await newInvoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isCredit: true,
          creditStatus: { $ne: 'paid' } // Pendientes o fiadas
        }
      },
      {
        $group: {
          _id: null,
          totalVentasPendientes: { $sum: '$total' },
          totalFacturasPendientes: { $sum: 1 }
        }
      }
    ]);

    // Obtener total de facturas (independientemente del estado)
    const totalFacturas = await newInvoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalFacturas: { $sum: 1 }
        }
      }
    ]);

    // Obtener gastos descontables del período
    const gastos = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          deductFromSales: true // Solo gastos descontables
        }
      },
      {
        $group: {
          _id: null,
          totalGastos: { $sum: '$amount' }
        }
      }
    ]);

    // Obtener datos de clientes
    const clientesStats = await Cliente.aggregate([
      {
        $group: {
          _id: null,
          totalClientes: { $sum: 1 },
          cuentasPendientes: { $sum: '$cuentasPendientes' },
          cuentasVendidas: { $sum: '$cuentasVendidas' }
        }
      }
    ]);

    // Obtener conteo de productos y servicios
    const productosCount = await Product.countDocuments({ type: 'product' });
    const serviciosCount = await Product.countDocuments({ type: 'service' });

    // Preparar los datos de respuesta
    const ventasConfirmadasHoy = ventasConfirmadas.length > 0 ? ventasConfirmadas[0].totalVentas : 0;
    const ventasPendientesHoy = ventasPendientes.length > 0 ? ventasPendientes[0].totalVentasPendientes : 0;
    const gastosHoy = gastos.length > 0 ? gastos[0].totalGastos : 0;
    const totalFacturasHoy = totalFacturas.length > 0 ? totalFacturas[0].totalFacturas : 0;
    const facturasConfirmadasHoy = ventasConfirmadas.length > 0 ? ventasConfirmadas[0].totalFacturas : 0;
    const facturasPendientesHoy = ventasPendientes.length > 0 ? ventasPendientes[0].totalFacturasPendientes : 0;

    // Calcular balance neto (ventas confirmadas - gastos descontables)
    const balanceHoy = ventasConfirmadasHoy - gastosHoy;

    // Calcular totales para el mes
    let ventasConfirmadasMes = 0;
    let ventasPendientesMes = 0;
    let gastosMes = 0;
    let totalFacturasMes = 0;

    // Si estamos consultando datos de hoy, también obtenemos datos del mes
    if (period === 'today') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Ventas confirmadas del mes
      const ventasConfirmadasMesQuery = await newInvoice.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth, $lte: endDate },
            $or: [
              { isCredit: { $ne: true } },
              { creditStatus: 'paid' }
            ]
          }
        },
        {
          $group: {
            _id: null,
            totalVentas: { $sum: '$total' },
            totalFacturas: { $sum: 1 }
          }
        }
      ]);

      // Ventas pendientes del mes
      const ventasPendientesMesQuery = await newInvoice.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth, $lte: endDate },
            isCredit: true,
            creditStatus: { $ne: 'paid' }
          }
        },
        {
          $group: {
            _id: null,
            totalVentasPendientes: { $sum: '$total' }
          }
        }
      ]);

      // Total de facturas del mes
      const totalFacturasMesQuery = await newInvoice.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalFacturas: { $sum: 1 }
          }
        }
      ]);

      // Gastos del mes
      const gastosMesQuery = await Expense.aggregate([
        {
          $match: {
            date: { $gte: startOfMonth, $lte: endDate },
            deductFromSales: true
          }
        },
        {
          $group: {
            _id: null,
            totalGastos: { $sum: '$amount' }
          }
        }
      ]);

      ventasConfirmadasMes = ventasConfirmadasMesQuery.length > 0 ? ventasConfirmadasMesQuery[0].totalVentas : 0;
      ventasPendientesMes = ventasPendientesMesQuery.length > 0 ? ventasPendientesMesQuery[0].totalVentasPendientes : 0;
      gastosMes = gastosMesQuery.length > 0 ? gastosMesQuery[0].totalGastos : 0;
      totalFacturasMes = totalFacturasMesQuery.length > 0 ? totalFacturasMesQuery[0].totalFacturas : 0;
    }

    // Calcular balance neto del mes
    const balanceMes = ventasConfirmadasMes - gastosMes;

    // NUEVO: Obtener productos más vendidos para el período seleccionado
    // Este código es similar al de getDetailedStats pero adaptado para todos los períodos
    const productosMasVendidos = await newInvoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          nombre: { $first: "$items.name" },
          cantidad: { $sum: "$items.quantity" },
          ingresos: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { cantidad: -1 } },
      { $limit: parseInt(productsLimit) }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalVentas: {
          hoy: ventasConfirmadasHoy,
          esteMes: ventasConfirmadasMes,
          pendientesHoy: ventasPendientesHoy,
          pendientesMes: ventasPendientesMes
        },
        facturasCreadas: {
          hoy: totalFacturasHoy,
          esteMes: totalFacturasMes,
          confirmadasHoy: facturasConfirmadasHoy,
          pendientesHoy: facturasPendientesHoy
        },
        balanceNeto: {
          hoy: balanceHoy,
          esteMes: balanceMes
        },
        gastos: {
          hoy: gastosHoy,
          esteMes: gastosMes
        },
        clientes: {
          totalClientes: clientesStats.length > 0 ? clientesStats[0].totalClientes : 0,
          cuentasPendientes: clientesStats.length > 0 ? clientesStats[0].cuentasPendientes : 0,
          cuentasVendidas: clientesStats.length > 0 ? clientesStats[0].cuentasVendidas : 0
        },
        productosServicios: {
          totalProductos: productosCount,
          totalServicios: serviciosCount
        },
        // NUEVO: Incluir productos más vendidos en la respuesta
        productosTopVendidos: productosMasVendidos
      }
    });
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos del dashboard',
      error: error.message
    });
  }
});

// @desc    Obtener estadísticas detalladas para el dashboard
// @route   GET /api/dashboard/stats
// @access  Private
export const getDetailedStats = asyncHandler(async (req, res) => {
  try {
    // Obtener período de consulta (últimos 7 días, últimos 30 días, etc.)
    const { period = 'week' } = req.query;
    
    // Definir fechas de inicio y fin según el período
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
    }
    
    // Obtener ventas detalladas por día
    const ventasPorDia = await newInvoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: today },
          // Excluir facturas fiadas/pendientes
          $or: [
            { isCredit: { $ne: true } },
            { creditStatus: 'paid' }
          ]
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          totalVentas: { $sum: "$total" },
          cantidadFacturas: { $sum: 1 },
          promedioVenta: { $avg: "$total" }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } }
    ]);
    
    // Obtener productos más vendidos
    const productosMasVendidos = await newInvoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: today }
        }
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          nombre: { $first: "$items.name" },
          cantidad: { $sum: "$items.quantity" },
          ingresos: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { cantidad: -1 } },
      { $limit: 5 }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        detailedStats: ventasPorDia,
        productosTopVendidos: productosMasVendidos
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas detalladas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas detalladas',
      error: error.message
    });
  }
});

// NUEVO: Endpoint específico para obtener productos más vendidos con paginación
// @desc    Obtener productos más vendidos con paginación
// @route   GET /api/dashboard/top-products
// @access  Private
export const getTopProducts = asyncHandler(async (req, res) => {
  try {
    // Extraer parámetros de consulta con valores predeterminados
    const { 
      period = 'today', 
      page = 1, 
      limit = 10, 
      sortBy = 'cantidad', 
      order = 'desc' 
    } = req.query;
    
    // Convertir a números
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Definir fechas de inicio y fin según el período
    const today = new Date();
    let startDate, endDate;
    
    endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
      case 'today':
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
    }
    
    // Primero obtenemos el total de productos para calcular la paginación
    const totalProductosQuery = await newInvoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product"
        }
      },
      {
        $count: "total"
      }
    ]);
    
    const totalProductos = totalProductosQuery.length > 0 ? totalProductosQuery[0].total : 0;
    
    // Determinamos el orden para la consulta
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOption = {};
    sortOption[sortBy] = sortOrder;
    
    // Calculamos el salto para la paginación
    const skip = (pageNum - 1) * limitNum;
    
    // Obtenemos los productos paginados
    const productosPaginados = await newInvoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          nombre: { $first: "$items.name" },
          cantidad: { $sum: "$items.quantity" },
          ingresos: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: sortOption },
      { $skip: skip },
      { $limit: limitNum }
    ]);
    
    // Calculamos el total de páginas
    const totalPages = Math.ceil(totalProductos / limitNum);
    
    // Construimos la respuesta con información de paginación
    res.status(200).json({
      success: true,
      data: {
        products: productosPaginados,
        pagination: {
          currentPage: pageNum,
          totalPages: totalPages,
          totalItems: totalProductos,
          itemsPerPage: limitNum
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener productos más vendidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos más vendidos',
      error: error.message
    });
  }
});

// @desc    Obtener ventas diarias agrupadas por fecha
// @route   GET /api/dashboard/daily-sales
// @access  Private
export const getDailySales = asyncHandler(async (req, res) => {
  try {
    // Extraer parámetros de consulta con valores predeterminados
    const { 
      startDate, 
      endDate,
      page = 1, 
      limit = 10, 
      sortBy = 'fecha', 
      order = 'desc' 
    } = req.query;
    
    // Convertir a números
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Definir fechas de inicio y fin
    const today = new Date();
    let queryStartDate, queryEndDate;
    
    // Si se proporcionan fechas explícitas, usarlas
    if (startDate && endDate) {
      queryStartDate = new Date(startDate);
      queryStartDate.setHours(0, 0, 0, 0);
      
      queryEndDate = new Date(endDate);
      queryEndDate.setHours(23, 59, 59, 999);
    } else {
      // Si no se proporcionan fechas, usar el mes actual
      queryStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
      queryStartDate.setHours(0, 0, 0, 0);
      
      queryEndDate = new Date(today);
      queryEndDate.setHours(23, 59, 59, 999);
    }
    
    // Obtener ventas agrupadas por día
    const ventasPorDia = await newInvoice.aggregate([
      {
        $match: {
          createdAt: { $gte: queryStartDate, $lte: queryEndDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          totalVentas: { $sum: "$total" },
          cantidadFacturas: { $sum: 1 },
          promedioVenta: { $avg: "$total" }
        }
      },
      {
        $project: {
          _id: 0,
          fecha: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.day"
            }
          },
          totalVentas: 1,
          cantidadFacturas: 1,
          promedioVenta: 1
        }
      }
    ]);
    
    // Contar el total de días para la paginación
    const totalDias = ventasPorDia.length;
    
    // Ordenar los resultados según los parámetros
    const sortOrder = order === 'asc' ? 1 : -1;
    ventasPorDia.sort((a, b) => {
      if (sortBy === 'fecha') {
        return sortOrder * (new Date(a.fecha) - new Date(b.fecha));
      } else if (sortBy === 'totalVentas') {
        return sortOrder * (a.totalVentas - b.totalVentas);
      } else if (sortBy === 'cantidadFacturas') {
        return sortOrder * (a.cantidadFacturas - b.cantidadFacturas);
      }
      return 0;
    });
    
    // Aplicar paginación
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;
    const ventasPaginadas = ventasPorDia.slice(startIndex, endIndex);
    
    // Calcular el total de páginas
    const totalPages = Math.ceil(totalDias / limitNum);
    
    // Construir la respuesta con información de paginación
    res.status(200).json({
      success: true,
      data: {
        sales: ventasPaginadas,
        pagination: {
          currentPage: pageNum,
          totalPages: totalPages,
          totalItems: totalDias,
          itemsPerPage: limitNum
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener ventas diarias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas diarias',
      error: error.message
    });
  }
});


export default {
  getDashboardData,
  getDetailedStats,
  getTopProducts,
  getDailySales
};