// src/components/Dashboard/Gastos.jsx
import { motion } from 'framer-motion';
import Card from '../common/Card';
import { DollarSign } from 'lucide-react';

const Gastos = ({ data = { hoy: 0, esteMes: 0 } }) => {
  // Aseguramos que los valores sean números
  const hoy = typeof data.hoy === 'number' ? data.hoy : 0;
  const esteMes = typeof data.esteMes === 'number' ? data.esteMes : 0;

  return (
    <Card title="Gastos" icon={DollarSign} color="red">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span>Hoy</span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-bold"
          >
            RD$ {hoy.toLocaleString()}
          </motion.span>
        </div>
        <div className="flex justify-between items-center">
          <span>Este mes</span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-bold"
          >
            RD$ {esteMes.toLocaleString()}
          </motion.span>
        </div>
      </div>
    </Card>
  );
};

export default Gastos;