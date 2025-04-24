import React, { useState } from 'react';
import CrearClienteForm from "../../components/formCrearClientes/CrearClienteForm";
import CrearUsuarioForm from "../../components/formCrearUsuarios/CrearUsuarioForm";
import { useAuth } from '../../context/AuthContext';

export const ClienteForm = () => {
  const [formType, setFormType] = useState('cliente');
  const { user } = useAuth();
  const isCajero = user?.role === 'cajero';
  return (
    <div className="p-4">
      {/* Botones para alternar entre formularios */}
      <div className="flex space-x-4 mb-6">
        <button
          type="button"
          onClick={() => setFormType('cliente')}
          className={`px-4 py-2 rounded ${formType === 'cliente' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Crear Cliente
        </button>
        {!isCajero && (
          <button
            type="button"
            onClick={() => setFormType('usuario')}
            className={`px-4 py-2 rounded ${formType === 'usuario' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Crear Usuario
          </button>
        )}
      </div>
      {/* Mostrar formulario según selección */}
      {formType === 'cliente' && <CrearClienteForm />}
      {formType === 'usuario' && !isCajero && <CrearUsuarioForm />}
    </div>
  );
};
