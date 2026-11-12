const path = require("path");
const mysql = require("mysql2/promise");
const fs = require("fs");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 4000),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "bright_minds_attendance",

  ssl: {
  ca: fs.readFileSync(
    path.resolve(__dirname, process.env.DB_CA_PATH || "isrgrootx1.pem")
  )
},

  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;

