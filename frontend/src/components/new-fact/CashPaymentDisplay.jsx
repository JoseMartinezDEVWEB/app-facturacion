import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente especializado para mostrar información de pago en efectivo
 * Este componente calcula los valores de forma independiente para evitar problemas de estado
 */
const CashPaymentDisplay = ({ total, cashReceived, currencySymbol = 'RD$' }) => {
  // Convertir explícitamente a números para evitar problemas de tipos
  const numericTotal = parseFloat(total) || 0;
  const numericCash = parseFloat(cashReceived) || 0;
  
  // Calcular el cambio directamente, no confiar en valores externos
  const change = Math.max(0, numericCash - numericTotal);
  
  // Para depuración - mostrar en consola los valores que se están usando
  console.log('CashPaymentDisplay - Valores:', { 
    total: numericTotal, 
    cashReceived: numericCash, 
    calculatedChange: change 
  });

  return (
    <div className="payment-details">
      <div className="flex justify-between">
        <span className="font-medium">CANT. EFECTIVO:</span>
        <span className="font-medium">
          {currencySymbol}{numericCash.toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="font-medium">DEVUELTA:</span>
        <span className="font-medium">
          {currencySymbol}{change.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

CashPaymentDisplay.propTypes = {
  total: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string
  ]).isRequired,
  cashReceived: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string
  ]).isRequired,
  currencySymbol: PropTypes.string
};

export default CashPaymentDisplay; 