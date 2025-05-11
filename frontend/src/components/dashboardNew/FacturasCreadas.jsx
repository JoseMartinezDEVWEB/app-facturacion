/* eslint-disable react/prop-types */
// src/components/Dashboard/FacturasCreadas.jsx
import { motion } from 'framer-motion';
import Card from '../common/Card';
import { FileText } from 'lucide-react';

const FacturasCreadas = ({ data = { hoy: 0, esteMes: 0 } }) => {
  // Animación para números
  const numberVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <Card title="Facturas Creadas" icon={FileText} color="blue">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span>Hoy</span>
          <motion.span
            initial="hidden"
            animate="visible"
            variants={numberVariants}
            className="font-bold text-2xl"
          >
            {data.hoy}
          </motion.span>
        </div>
        <div className="flex justify-between items-center">
          <span>Este mes</span>
          <motion.span
            initial="hidden"
            animate="visible"
            variants={numberVariants}
            className="font-bold text-2xl"
          >
            {data.esteMes}
          </motion.span>
        </div>
      </div>
    </Card>
  );
};

export default FacturasCreadas;