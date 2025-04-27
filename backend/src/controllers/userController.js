import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';

// Función de utilidad para añadir un tiempo de espera artificial (para simular cargas)
const addDelay = (ms = 2000) => new Promise(resolve => setTimeout(resolve, ms));

// Crear un nuevo usuario
export const createUser = async (req, res) => {
    try {
      // Agregar retraso artificial de 3 segundos
      await addDelay(3000);

      const { username, email, password, role } = req.body;
  
      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          message: 'User with this email or username already exists' 
        });
      }
  
      // Validate role permissions
      const allowedRoles = {
        'admin': ['admin', 'encargado', 'cajero', 'cliente'],
        'encargado': ['cajero', 'cliente'],
        'cajero': ['cliente'],
        'cliente': []
      };
  
      if (!allowedRoles[req.user.role].includes(role)) {
        return res.status(403).json({ 
          message: 'You do not have permission to create users with this role' 
        });
      }
  
      const user = await User.create({
        username,
        email,
        password,
        role
      });
  
      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  export const getUsers = async (req, res) => {
    try {
      // Agregar retraso artificial de 3 segundos
      await addDelay(3000);

      const users = await User.find()
        .select('-password')
        .sort({ createdAt: -1 });
        
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  

export const login = async (req, res) => {
    try {
      // Agregar retraso artificial de 3 segundos
      await addDelay(3000);

      const { email, password } = req.body;
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '60d' }
      );
  
      res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  // Nuevo método para crear el admin inicial
export const createInitialAdmin = async (req, res) => {
    try {
      // Agregar retraso artificial de 3 segundos
      await addDelay(3000);

      // Verificar si ya existe un admin
      const adminExists = await User.findOne({ role: 'admin' });
      if (adminExists) {
        return res.status(400).json({ 
          message: 'el admin ya existe' 
        });
      }
  
      const { username, email, password } = req.body;
  
      // Crear el admin
      const admin = await User.create({
        username,
        email,
        password,
        role: 'admin' // Forzar el rol admin
      });
  
      res.status(201).json({
        message: 'Admin user created successfully',
        user: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Server error', 
        error: error.message 
      });
    }
  };

  export const getUserInfo = async (req, res) => {
    try {
        // Agregar retraso artificial de 3 segundos
        await addDelay(3000);

        // El middleware authMiddleware ya adjuntó el usuario (sin password)
        // req.user contiene el objeto User completo
        const user = req.user;

        if (!user) {
            // Esto no debería ocurrir si authMiddleware funcionó, pero por seguridad
            return res.status(404).json({
                msg: 'Usuario no encontrado o no autenticado'
            });
        }

        // Devolver solo la información necesaria
        res.json({
            id: user._id, // o user.id
            username: user.username,
            email: user.email,
            role: user.role
        });

    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).json({
            msg: 'Error del servidor al obtener información del usuario'
        });
    }
};
