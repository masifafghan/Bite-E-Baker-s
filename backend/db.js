// backend/db.js
import mysql from "mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",            // set your MySQL password if any
  database: "bite_e_bakers" // create this DB in phpMyAdmin before running
});

db.connect(err => {
  if (err) {
    console.error("❌ MySQL connection error:", err.message);
  } else {
    console.log("✅ Connected to MySQL (bite_e_bakers)");
  }
});

export default db;
