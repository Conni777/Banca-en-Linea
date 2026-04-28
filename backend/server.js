const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const supabase = require('./config/supabaseClient');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

dotenv.config();

console.log("Conectado a Supabase correctamente");

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Cargar documento Swagger
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

// Ruta para la documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/transacciones', transactionRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ status: "Servidor de Banca Online Operativo" });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor base ejecutándose en http://localhost:${port}`);
  console.log(`Documentación de Swagger disponible en http://localhost:${port}/api-docs`);
});
