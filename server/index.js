const express = require('express');
const app = express();
const PORT = process.env.PORT || 5050;

app.use(express.json());

const warehouseRoutes = require('./routes/warehouseRoute');
const inventoryRoutes = require('./routes/inventoryRoute');

app.get('/api', (_req, res) => {
  res.send("Welcome to my API");
});
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/inventories', inventoryRoutes);

app.listen(PORT, () => {
  console.log(`running at http://localhost:${PORT}`);
});
