
// src/utils/dateHelpers.js
export const getDateRange = (period) => {
  const now = new Date();
  const startDate = new Date(now);
  const endDate = new Date(now);

  switch (period) {
    case 'day':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'month':
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'year':
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return { startDate, endDate };
};
// Función auxiliar para formatear fechas
export const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Función para obtener el rango de fechas en formato legible
export const getReadableDateRange = (period) => {
  const { startDate, endDate } = getDateRange(period);
  return {
    start: formatDate(startDate),
    end: formatDate(endDate)
  };
};