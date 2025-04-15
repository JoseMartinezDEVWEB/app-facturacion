import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';

// Crear un nuevo usuario
export const createUser = async (req, res) => {
    try {
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
        { expiresIn: '30d' }
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
        const userId = req.user.id;
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({
                msg: 'Usuario no encontrado'
            });
        }

        res.json({
            nombre: user.nombre,
            rol: user.rol,
            email: user.email
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error del servidor'
        });
    }
};
