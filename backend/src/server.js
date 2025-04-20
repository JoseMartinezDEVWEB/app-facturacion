import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import userRouter from "./routes/userRouter.js";
import productRouter from "./routes/productRouter.js";
import categoryRouter from "./routes/categoryRoutes.js";
import businessRouter from "./routes/businessRoutes.js";
import daliyRepoortRouter from "./routes/dailyReportRoutes.js";
import invoiceRoutes from './routes/newInvoices.js'
import dashboardRouter from "./routes/dashboard.js";
import expenseRoutes from './routes/expenseRoutes.js';
import clienteRoutes  from './routes/clienteRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes.js';
import creditPaymentRoutes from './routes/creditPaymentRoutes.js';
// import facturaRoutes from './routes/invoiceRoutes.js';
import creditNoteRoutes from './routes/creditNoteRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';
import retentionRoutes from './routes/retentionRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import creditPurchaseRoutes from './routes/creditPurchaseRoutes.js';

import path from "path";
import morgan from "morgan";
import { fileURLToPath } from "url";

const app = express();
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(morgan('dev'))

app.use(express.urlencoded({ extended: true }));

// Configuración de CORS que permite acceso remoto
app.use(cors({
    origin: function(origin, callback) {
        // Permitir solicitudes sin origen (como aplicaciones móviles o curl)
        if (!origin) return callback(null, true);
        
        // Lista de orígenes permitidos
        const allowedOrigins = [
            'http://localhost:5173', 
            'http://127.0.0.1:5173',
            // Permitir acceder desde la IP local en la red
            /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
            /^http:\/\/172\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
            /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/
        ];
        
        // Verificar si el origen está permitido
        const allowed = allowedOrigins.some(allowedOrigin => {
            if (typeof allowedOrigin === 'string') {
                return allowedOrigin === origin;
            }
            return allowedOrigin.test(origin);
        });
        
        if (allowed) {
            return callback(null, true);
        } else {
            const msg = 'El origen CORS no está permitido';
            return callback(new Error(msg), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

connectDB();


// Middleware para verificar las peticiones
app.use((req, res, next) => {
    console.log('Request Headers:', req.headers);
    console.log('Request Method:', req.method);
    console.log('Request URL:', req.url);
    next();
});

// Headers adicionales de CORS - Permitir acceso desde cualquier origen aprobado
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        // Devolver el mismo origen que hizo la solicitud si está permitido
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

// Middleware para acceso remoto con autenticación HTTP básica
// Solo se activa cuando se accede desde una IP que no es localhost
app.use((req, res, next) => {
    const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip.includes('192.168.') || req.ip.includes('10.') || req.ip.includes('172.');
    
    // Si es una solicitud OPTIONS o es localhost, permitir sin autenticación
    if (req.method === 'OPTIONS' || isLocalhost || req.path.startsWith('/api/auth')) {
        return next();
    }
    
    // Verificar credenciales básicas para acceso remoto
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Acceso al sistema de facturación"');
        return res.status(401).json({ message: 'Se requiere autenticación para acceso remoto' });
    }
    
    // Decodificar credenciales
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [username, password] = credentials.split(':');
    
    // Verificar contra variables de entorno (deberían configurarse en .env)
    const remoteUser = process.env.REMOTE_ACCESS_USER || 'admin';
    const remotePass = process.env.REMOTE_ACCESS_PASSWORD || 'admin123';
    
    if (username !== remoteUser || password !== remotePass) {
        return res.status(401).json({ message: 'Credenciales incorrectas para acceso remoto' });
    }
    
    next();
});

// Middleware para verificar las peticiones
app.use((req, res, next) => {
    console.log('Request Headers:', req.headers);
    console.log('Request Method:', req.method);
    console.log('Request URL:', req.url);
    next();
});

app.use("/api", userRouter);
app.use("/api/products", productRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/business", businessRouter);
app.use("/api/daily-reports", daliyRepoortRouter);
app.use("/api/newinvoices", invoiceRoutes);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/expenses', expenseRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/credit-payments', creditPaymentRoutes);
// app.use('/api/facturas', facturaRoutes);
app.use('/api/credit-notes', creditNoteRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/retentions', retentionRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/credit-purchases', creditPurchaseRoutes);


const port = process.env.PORT || 4000;

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
})
 
// Carpeta para archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});


app.listen(port, () => console.log(`Server running on port ${port}`));