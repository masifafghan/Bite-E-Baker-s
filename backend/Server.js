// backend/server.js
import express from "express";
import path from "path";
import cors from "cors";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import db from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static frontend from /public
const publicPath = path.join(__dirname, "../public");
app.use(express.static(publicPath));

/* ---------------------- ROUTES ---------------------- */

// Default route → login page
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "login.html"));
});

/**
 * @route POST /api/customer
 * @desc Save customer info in database
 */
app.post("/api/customer", (req, res) => {
  const { FirstName, LastName, MobileNumber, PinCode, Address, EmailId } = req.body;

  if (!FirstName || !MobileNumber || !Address) {
    return res.status(400).json({ status: "error", message: "Missing required fields" });
  }

  const sql = `
    INSERT INTO customers (firstname, lastname, mobilenumber, pincode, address, email)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [FirstName, LastName, MobileNumber, PinCode, Address, EmailId], (err, result) => {
    if (err) {
      console.error("❌ DB Insert Error:", err);
      return res.status(500).json({ status: "error", message: "DB insert failed" });
    }

    res.json({ status: "success", customer_id: result.insertId });
  });
});

/**
 * @route POST /api/order
 * @desc Save order and order items
 */
app.post("/api/order", (req, res) => {
  const { customer_id, cart } = req.body;

  if (!customer_id || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ status: "error", message: "Invalid order data" });
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 1️⃣ Insert into orders table
  db.query(
    "INSERT INTO orders (customer_id, total_amount) VALUES (?, ?)",
    [customer_id, total],
    (err, orderResult) => {
      if (err) {
        console.error("❌ Order Insert Error:", err);
        return res.status(500).json({ status: "error", message: err.message });
      }

      const order_id = orderResult.insertId;
      const values = cart.map(item => [order_id, item.id, item.quantity, item.price]);

      // 2️⃣ Insert multiple order items
      db.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
        [values],
        (err2) => {
          if (err2) {
            console.error("❌ Order Items Insert Error:", err2);
            return res.status(500).json({ status: "error", message: err2.message });
          }

          // ✅ Respond success in JSON
          res.json({ status: "success", order_id });
        }
      );
    }
  );
});

/**
 * Fallback → serve frontend for any other route
 */
// Fallback for all non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(publicPath, "login.html"));
});

/* ---------------------- START SERVER ---------------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
  console.log(`📂 Serving static files from: ${publicPath}`);
});
