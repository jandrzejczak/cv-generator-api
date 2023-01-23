require("dotenv").config();
const express = require("express");
const fileUpload = require('express-fileupload');
const bodyParser = require("body-parser");
const cors = require("cors");
const { initializeDatabase } = require("./config/database");
const { promisify } = require("util");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger.json');
const routes = require("./routes/router");

const app = express();
app.use(cors());

// File upload
app.use(fileUpload());
app.use(express.static('public'))

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use("/", routes);

const startServer = async () => {
  await initializeDatabase(app);
  const port = process.env.PORT || 3000;
  await promisify(app.listen).bind(app)(port);
  console.log(`Listening on port ${port} http://localhost:${port}`);
};

startServer();
