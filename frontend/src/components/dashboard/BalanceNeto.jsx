/* eslint-disable react/prop-types */
import { motion } from 'framer-motion';
import Card from '../common/Card';
import { TrendingUp } from 'lucide-react';

const BalanceNeto = ({ data = { hoy: 0, esteMes: 0 } }) => {
  // Aseguramos que los valores sean números
  const hoy = typeof data.hoy === 'number' ? data.hoy : 0;
  const esteMes = typeof data.esteMes === 'number' ? data.esteMes : 0;
  
  // Determinar el color según el balance
  const getBalanceColor = (value) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };
  
  // Determinar el ícono según el balance
  const getBalanceIcon = (value) => {
    if (value > 0) return '↑';
    if (value < 0) return '↓';
    return '→';
  };

  return (
    <Card title="Balance Neto" icon={TrendingUp} color="green">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span>Hoy</span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`font-bold ${getBalanceColor(hoy)}`}
          >
            {getBalanceIcon(hoy)} RD$ {Math.abs(hoy).toLocaleString()}
          </motion.span>
        </div>
        <div className="flex justify-between items-center">
          <span>Este mes</span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`font-bold ${getBalanceColor(esteMes)}`}
          >
            {getBalanceIcon(esteMes)} RD$ {Math.abs(esteMes).toLocaleString()}
          </motion.span>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <p>* Ventas confirmadas menos gastos descontables</p>
        </div>
      </div>
    </Card>
  );
};

export default BalanceNeto;