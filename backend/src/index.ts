import express from 'express';
import cors from 'cors';
import { DijkstraController } from './controllers/dijkstra-controller.js';

const app = express();
const PORT = process.env.PORT || 3000;

// middlewares
app.use(cors());
app.use(express.json());

// endpoint de la API
app.post('/api/dijkstra', DijkstraController.calculate);

// inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});