import { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4500/api'; // Ajusta la URL de tu backend

// eslint-disable-next-line react/prop-types
const BusinessForm = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: {
      street: '',
      suite: '',
      city: '',
      state: '',
      zipCode: ''
    },
    phone: '',
    taxId: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('address.')) {
      const addressField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/business`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      onSave(response.data); // Guardar los datos en el estado principal
      onClose(); // Cerrar el modal
    } catch (error) {
      console.error('Error al guardar los datos del negocio:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Agregar Datos del Negocio</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Nombre del Negocio</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-2">Dirección</label>
          <input
            type="text"
            name="address.street"
            value={formData.address.street}
            onChange={handleChange}
            placeholder="Calle"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="address.suite"
            value={formData.address.suite}
            onChange={handleChange}
            placeholder="Suite"
            className="w-full p-2 border rounded mt-2"
          />
          <input
            type="text"
            name="address.city"
            value={formData.address.city}
            onChange={handleChange}
            placeholder="Ciudad"
            className="w-full p-2 border rounded mt-2"
          />
          <input
            type="text"
            name="address.state"
            value={formData.address.state}
            onChange={handleChange}
            placeholder="Estado"
            className="w-full p-2 border rounded mt-2"
          />
          <input
            type="text"
            name="address.zipCode"
            value={formData.address.zipCode}
            onChange={handleChange}
            placeholder="Código Postal"
            className="w-full p-2 border rounded mt-2"
          />
        </div>
        <div>
          <label className="block mb-2">Teléfono</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-2">RFC o Identificador Fiscal</label>
          <input
            type="text"
            name="taxId"
            value={formData.taxId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessForm;