import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import CashPaymentDisplay from './CashPaymentDisplay';

const InvoicePrintTemplate = forwardRef(({ cart, customer, totals, paymentMethod, businessInfo, currentUser, invoiceNumber, isCredit, clientName, cashReceivedValue }, ref) => {
    const formatDate = (date) => {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        };
        return new Date(date).toLocaleDateString('es-ES', options);
    };

    const formatTime = (date) => {
        const options = { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true
        };
        return new Date(date).toLocaleTimeString('es-ES', options);
    };

    // Determinar la moneda a mostrar
    const currencySymbol = businessInfo?.currency || 'RD$';
    
    // Obtener el monto en efectivo de cashReceivedValue (nueva prop) o del objeto totals
    const effectiveCashReceived = cashReceivedValue !== undefined ? cashReceivedValue : (totals.cashReceived || 0);
    
    // IMPORTANTE: Verificar el método de pago real - nunca mostrar efectivo en compras fiadas
    // Si es una compra fiada, ignorar cualquier valor de efectivo
    const actualPaymentMethod = isCredit ? 'credit' : paymentMethod;
    
    // Valor para depuración
    console.log('InvoicePrintTemplate - Render con valores:', {
        paymentMethod: actualPaymentMethod,
        isCredit,
        total: totals.total,
        cashReceived: effectiveCashReceived,
        fromCashReceivedProp: cashReceivedValue !== undefined
    });

    return (
        <div ref={ref} className="p-6 max-w-md mx-auto">
            <div className="text-center mb-4">
                <h1 className="text-2xl font-bold">{businessInfo.name || 'Mi Negocio'}</h1>
                {businessInfo.slogan && (
                    <p className="text-sm italic">{businessInfo.slogan}</p>
                )}
                {businessInfo.address && (
                    <p className="text-sm">{businessInfo.address}</p>
                )}
                <p className="text-sm">Tel: {businessInfo.phone || ''}</p>
                <p className="text-sm">RNC: {businessInfo.rnc || ''}</p>
                <hr className="my-2" />
                <div className="flex justify-between text-sm">
                    <span>Fecha: {formatDate(new Date())}</span>
                    <span>Hora: {formatTime(new Date())}</span>
                </div>
                <div className="flex justify-between text-sm">
                    {businessInfo.showCashier !== false && (
                        <span>Cajero: {currentUser?.name || localStorage.getItem('userName') || localStorage.getItem('currentUserName') || sessionStorage.getItem('userName') || 'No identificado'}</span>
                    )}
                    <span>Tipo de Compra: {invoiceNumber ? 'Factura' : 'Desconocido'}</span>
                </div>
                {invoiceNumber && (
                    <p className="text-sm">Factura Nº: {invoiceNumber}</p>
                )}
                
                {/* Mostrar distintivo de compra fiada */}
                {isCredit && (
                    <div className="mt-2 p-2 border-2 border-red-500 rounded text-center">
                        <h3 className="font-bold text-red-600">COMPRA FIADA</h3>
                        <p className="text-sm">{clientName || customer.name}</p>
                    </div>
                )}
            </div>

            <div className="border-t border-b py-2 mb-4">
                <h2 className="font-bold">Cliente:</h2>
                <p>{isCredit ? (clientName || customer.name) : (customer.name || 'Cliente General')}</p>
                {customer.email && <p className="text-sm">{customer.email}</p>}
                {customer.phone && <p className="text-sm">Tel: {customer.phone}</p>}
            </div>

            <table className="w-full mb-4">
                <thead>
                    <tr className="border-b">
                        <th className="text-left">Descripción</th>
                        <th className="text-center">Cant.</th>
                        <th className="text-right">Precio</th>
                        <th className="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {cart.map((item, index) => (
                        <tr key={index} className="border-b">
                            <td className="text-left overflow-hidden text-ellipsis">{item.name}</td>
                            <td className="text-center">{item.quantity}</td>
                            <td className="text-right">{currencySymbol}{parseFloat(item.salePrice).toFixed(2)}</td>
                            <td className="text-right">
                                {currencySymbol}{(item.quantity * parseFloat(item.salePrice)).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-t pt-2">
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{currencySymbol}{totals.subtotal.toFixed(2)}</span>
                </div>
                {totals.tax > 0 && (
                    <div className="flex justify-between">
                        <span>ITBIS ({(totals.taxRate || 18)}%):</span>
                        <span>{currencySymbol}{totals.tax.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                    <span>Total:</span>
                    <span>{currencySymbol}{totals.total.toFixed(2)}</span>
                </div>
                <div className="mt-3 pt-2 border-t">
                    <div className="flex justify-between">
                        <span>Método de pago:</span>
                        <span>{
                            isCredit ? 'Crédito (Fiado)' :
                            paymentMethod === 'cash' ? 'Efectivo' :
                            paymentMethod === 'card' || paymentMethod === 'credit_card' ? 'Tarjeta' :
                            paymentMethod === 'bank_transfer' ? 'Transferencia' :
                            'Transferencia'
                        }</span>
                    </div>
                </div>
                
                {/* Para compras fiadas, mostrar información adicional */}
                {isCredit && (
                    <div className="flex justify-between mt-2">
                        <span>Estado:</span>
                        <span>Pendiente de pago</span>
                    </div>
                )}
                
                {/* IMPORTANTE: Usar el nuevo componente SOLO para pagos en efectivo y NUNCA para crédito */}
                {!isCredit && actualPaymentMethod === 'cash' && (
                    <CashPaymentDisplay 
                        total={totals.total} 
                        cashReceived={effectiveCashReceived}
                        currencySymbol={currencySymbol}
                    />
                )}
            </div>

            <div className="text-center mt-6 text-sm">
                {isCredit && (
                    <div className="mb-3 p-2 border border-gray-300 rounded">
                        <p className="font-bold">COMPROBANTE DE DEUDA</p>
                        <p>Esta factura representa una deuda pendiente de pago.</p>
                    </div>
                )}
                <p className="mt-4 border-t pt-2">{businessInfo.footer || '¡Gracias por su compra!'}</p>
                {businessInfo.website && (
                    <p className="mt-1">{businessInfo.website}</p>
                )}
            </div>
        </div>
    );
});

InvoicePrintTemplate.propTypes = {
    cart: PropTypes.array.isRequired,
    customer: PropTypes.object.isRequired,
    totals: PropTypes.object.isRequired,
    paymentMethod: PropTypes.string.isRequired,
    businessInfo: PropTypes.object.isRequired,
    currentUser: PropTypes.object,
    invoiceNumber: PropTypes.string,
    isCredit: PropTypes.bool,
    clientName: PropTypes.string,
    // Nueva prop para pasar directamente el valor de efectivo recibido
    cashReceivedValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

InvoicePrintTemplate.displayName = 'InvoicePrintTemplate';

export default InvoicePrintTemplate;