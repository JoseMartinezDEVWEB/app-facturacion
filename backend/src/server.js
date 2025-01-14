import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import userRouter from "./routes/userRouter.js";
import productRouter from "./routes/productRouter.js";
import categoryRouter from "./routes/categoryRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api", userRouter);
app.use("/api/products", productRouter);
app.use("/api/categories", categoryRouter);

const port = process.env.PORT || 4000;

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
})

// Carpeta para archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.listen(port, () => console.log(`Server running on port ${port}`));