import { useState } from 'react';
import BusinessForm from './BusinessForm'; // Importar el formulario de negocio
import { Modal } from '../../components/Modal'; // Importar el componente Modal
import { AnimatePresence } from 'framer-motion';

const BusinessInfo = () => {
  const [showBusinessForm, setShowBusinessForm] = useState(false); // Estado para mostrar el formulario
  const [businessInfo, setBusinessInfo] = useState(null); // Estado para la información del negocio

  // Función para guardar los datos del negocio
  const handleSaveBusinessInfo = (data) => {
    setBusinessInfo(data);
    setShowBusinessForm(false); // Cerrar el modal después de guardar
  };

  return (
    <div>
      <button
        onClick={() => setShowBusinessForm(true)}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Agregar Datos del Negocio
      </button>

      {/* Modal para el formulario de negocio */}
      <AnimatePresence>
        {showBusinessForm && (
          <Modal isOpen={showBusinessForm} onClose={() => setShowBusinessForm(false)} title="Datos del Negocio">
            <BusinessForm
              onClose={() => setShowBusinessForm(false)}
              onSave={handleSaveBusinessInfo}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Mostrar la información del negocio si está disponible */}
      {businessInfo && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-semibold">Información del Negocio:</h3>
          <p>Nombre: {businessInfo.name}</p>
          {businessInfo.address && (
            <p>
              Dirección: {businessInfo.address.street}, {businessInfo.address.city}, {businessInfo.address.state}
            </p>
          )}
          <p>Teléfono: {businessInfo.phone}</p>
          <p>RFC: {businessInfo.taxId}</p>
        </div>
      )}
    </div>
  );
};

export default BusinessInfo;