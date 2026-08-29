const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();


// =====================================================
// ROUTES
// =====================================================

const rateCardRoutes = require("./routes/rateCardRoutes");
const adminRoutes = require("./routes/adminRoutes");


// =====================================================
// APP
// =====================================================

const app = express();

const PORT = 5001;


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: "http://localhost:5174",
  })
);

app.use(
  express.json()
);


// =====================================================
// DATABASE
// =====================================================

const db = mysql.createPool({

  host: "localhost",

  user: "root",

  password:
    process.env.DB_PASSWORD,

  database: "shipdrop",

});


// =====================================================
// ADMIN BACKEND TEST
// =====================================================

app.get(
  "/",
  (req, res) => {

    res.json({
      message:
        "ShipDrop Admin Backend is running",
    });

  }
);


// =====================================================
// DATABASE TEST
// =====================================================

app.get(
  "/api/db-test",
  async (req, res) => {

    try {

      const [result] =
        await db.query(
          "SELECT 1 AS connected"
        );


      res.json({

        message:
          "Database connected successfully",

        result,

      });

    } catch (error) {

      console.error(
        "Database error:",
        error.message
      );


      res.status(500).json({

        message:
          "Database connection failed",

      });

    }

  }
);


// =====================================================
// ADMIN LOGIN
// =====================================================

app.post(
  "/api/admin/login",
  async (req, res) => {

    try {

      const {
        username,
        password,
      } = req.body;


      // -----------------------------------------------
      // VALIDATION
      // -----------------------------------------------

      if (
        !username ||
        !password
      ) {

        return res.status(400).json({

          message:
            "Username and password are required",

        });

      }


      // -----------------------------------------------
      // FIND ADMIN
      // -----------------------------------------------

      const [admins] =
        await db.query(

          `
            SELECT
              id,
              username,
              password
            FROM admins
            WHERE username = ?
            LIMIT 1
          `,

          [username]

        );


      if (
        admins.length === 0
      ) {

        return res.status(401).json({

          message:
            "Invalid username or password",

        });

      }


      const admin =
        admins[0];


      // -----------------------------------------------
      // CHECK PASSWORD
      // -----------------------------------------------

      const passwordMatch =
        await bcrypt.compare(
          password,
          admin.password
        );


      if (!passwordMatch) {

        return res.status(401).json({

          message:
            "Invalid username or password",

        });

      }


      // -----------------------------------------------
      // CREATE JWT
      // -----------------------------------------------

      const token =
        jwt.sign(

          {
            id:
              admin.id,

            username:
              admin.username,

            role:
              "admin",
          },

          process.env.JWT_SECRET,

          {
            expiresIn:
              "8h",
          }

        );


      // -----------------------------------------------
      // RESPONSE
      // -----------------------------------------------

      res.json({

        message:
          "Login successful",

        token,

        admin: {

          id:
            admin.id,

          username:
            admin.username,

          role:
            "admin",

        },

      });

    } catch (error) {

      console.error(
        "Login error:",
        error.message
      );


      res.status(500).json({

        message:
          "Something went wrong",

      });

    }

  }
);


// =====================================================
// RATE CARD ROUTES
// =====================================================

app.use(
  "/api/rate-cards",
  rateCardRoutes
);


// =====================================================
// ADMIN / USER ROUTES
// =====================================================

app.use(
  "/api/admin",
  adminRoutes
);


// =====================================================
// START SERVER
// =====================================================

app.listen(
  PORT,
  () => {

    console.log(
      `ShipDrop Admin Backend running on port ${PORT}`
    );

  }
);