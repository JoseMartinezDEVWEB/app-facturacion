import React, { useState } from 'react';
import api from '../../config/axiosConfig';

const CrearUsuarioForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'cliente'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const validate = () => {
    const errs = {};
    if (!formData.username) errs.username = 'Nombre de usuario es requerido';
    if (!formData.email) errs.email = 'Correo es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Correo inválido';
    if (!formData.password) errs.password = 'Contraseña es requerida';
    else if (formData.password.length < 6) errs.password = 'Mínimo 6 caracteres';
    if (!formData.role) errs.role = 'Rol es requerido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) validate();
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setMessage('');
    try {
      await api.post('/auth/users', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      setMessage('Usuario creado exitosamente');
      setFormData({ username: '', email: '', password: '', role: 'cliente' });
    } catch (err) {
      console.error('Error al crear usuario:', err);
      setMessage(err.response?.data?.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-semibold mb-4">Crear Usuario</h2>
      {message && <div className="mb-4 text-green-600">{message}</div>}
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Usuario</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        {errors.username && <p className="text-red-600 text-sm mt-1">{errors.username}</p>}
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Correo</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Contraseña</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Rol</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="admin">Admin</option>
          <option value="encargado">Encargado</option>
          <option value="cajero">Cajero</option>
          <option value="cliente">Cliente</option>
        </select>
        {errors.role && <p className="text-red-600 text-sm mt-1">{errors.role}</p>}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creando...' : 'Crear Usuario'}
      </button>
    </form>
  );
};

export default CrearUsuarioForm; 