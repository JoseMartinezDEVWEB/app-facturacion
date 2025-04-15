/* eslint-disable react/prop-types */
// src/components/Dashboard/TotalVentas.jsx
import { motion } from 'framer-motion';
import Card from '../common/Card';
import { ShoppingBag, BarChart2 } from 'lucide-react';
import { useState } from 'react';
import DetallesVentasModal from './DetallesVentasModal';

const TotalVentas = ({ data = { hoy: 0, esteMes: 0, pendientesHoy: 0, pendientesMes: 0 } }) => {
  const [showModal, setShowModal] = useState(false);
  
  // Aseguramos que los valores sean números para evitar errores
  const hoy = typeof data.hoy === 'number' ? data.hoy : 0;
  const esteMes = typeof data.esteMes === 'number' ? data.esteMes : 0;
  const pendientesHoy = typeof data.pendientesHoy === 'number' ? data.pendientesHoy : 0;
  const pendientesMes = typeof data.pendientesMes === 'number' ? data.pendientesMes : 0;

  // Animación para números
  const numberVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
  };

  return (
    <>
      <Card title="Total Ventas" icon={ShoppingBag} color="green">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Hoy</span>
            <motion.span
              initial="hidden"
              animate="visible"
              variants={numberVariants}
              className="font-bold"
            >
              RD$ {hoy.toLocaleString()}
            </motion.span>
          </div>
          <div className="flex justify-between items-center">
            <span>Este mes</span>
            <motion.span
              initial="hidden"
              animate="visible"
              variants={numberVariants}
              className="font-bold"
            >
              RD$ {esteMes.toLocaleString()}
            </motion.span>
          </div>
          
          {/* Botón para mostrar detalles */}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center text-sm text-green-600 hover:text-green-800"
            >
              <BarChart2 size={14} className="mr-1" />
              <span>Ver detalles de ventas</span>
            </button>
          </div>
        </div>
      </Card>
      
      {/* Modal con detalles */}
      <DetallesVentasModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        data={{
          confirmadasHoy: hoy,
          confirmadasMes: esteMes,
          pendientesHoy: pendientesHoy,
          pendientesMes: pendientesMes
        }}
      />
    </>
  );
};

export default TotalVentas;