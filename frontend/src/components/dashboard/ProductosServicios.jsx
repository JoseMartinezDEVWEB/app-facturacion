/* eslint-disable react/prop-types */
// src/components/Dashboard/ProductosServicios.jsx
import { motion } from 'framer-motion';
import Card from '../common/Card';
import { Package } from 'lucide-react';

const ProductosServicios = ({ data = { totalProductos: 0, totalServicios: 0 } }) => {
  return (
    <Card title="Productos y Servicios" icon={Package} color="yellow">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span>Total Productos</span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-bold"
          >
            {data.totalProductos}
          </motion.span>
        </div>
        <div className="flex justify-between items-center">
          <span>Total Servicios</span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-bold"
          >
            {data.totalServicios}
          </motion.span>
        </div>
      </div>
    </Card>
  );
};

export default ProductosServicios;