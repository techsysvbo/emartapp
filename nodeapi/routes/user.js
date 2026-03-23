const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const secretOrKey = require("../config/keys").secretOrKey;
const User = require("../models/User"); // User model

const validateRegisterInput = require("../validation/register"); // register validation
const validateLoginInput = require("../validation/login"); // login validation

// ---------------------------------------------------------------------------
// SMTP transport – credentials are loaded from environment variables only.
// Set SMTP_ENABLED=false to disable email notifications (e.g. local dev).
// ---------------------------------------------------------------------------
function sendMail(to, subject, text) {
  if (process.env.SMTP_ENABLED === "false" || !process.env.SMTP_USER) {
    return; // email notifications disabled or not configured
  }
  const sender = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || "gmail",
    type: "SMTP",
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  sender.sendMail(
    { from: process.env.SMTP_USER, to, subject, text },
    (error, info) => {
      if (error) {
        console.error("Mail send error:", error.message);
      } else {
        console.log("Email sent:", info.response);
      }
    }
  );
}

// Admin role is controlled via a comma-separated env var only, e.g.:
//   ADMIN_EMAILS=admin@example.com,ops@example.com
// User-supplied name or email fields never grant admin access automatically.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

//----------------------------------Routes----------------------------------//

// @route   POST /api/user/register
// @desc    Register user
// @access  Public
router.post("/register", (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);
  if (!isValid) return res.status(400).json({ success: false, message: errors });
  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      errors.email = "Email already exists";
      return res.status(400).json({ success: false, message: errors.email });
    } else {
      User.findOne({ cardId: req.body.cardId }).then(user => {
        if (user) {
          errors.cardId = "Personal ID already exists";
          return res.status(400).json({ success: false, message: errors.cardId });
        } else {
          const urole = ADMIN_EMAILS.includes(req.body.email.toLowerCase()) ? 1 : 0;

          const newUser = new User({
            role: urole,
            cardId: req.body.cardId,
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
            password: req.body.password,
            city: req.body.city,
            street: req.body.street,
          });
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              newUser.password = hash;
              newUser
                .save()
                .then(user => {
                  sendMail(
                    req.body.email,
                    "E-MART Registration Successful",
                    `Dear ${req.body.fname}! Your registration finished successfully.\nWelcome to E-MART.\nThank you!`
                  );
                  res.json({ success: true, user });
                })
                .catch(() =>
                  res.status(404).json({ success: false, message: "Could not register user" })
                );
            });
          });
        }
      });
    }
  });
});

// @route   POST /api/user/login
// @desc    Login user | Returning JWT Token
// @access  Public
router.post("/login", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email }).then(user => {
    if (!user) {
      errors.email = "User not found";
      return res.status(400).json({ success: false, message: errors.email });
    }
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        const payload = { id: user.id, fname: user.fname, lname: user.lname };
        jwt.sign(payload, secretOrKey, (err, token) => {
          if (err) throw err;
          sendMail(
            email,
            "E-MART Login Alert",
            `Dear ${email}, you logged in successfully at ${new Date().toISOString()}`
          );
          res.json({ success: true, message: "Token was assigned", token, user });
        });
      } else {
        errors.password = "Password is incorrect";
        return res.status(400).json({ success: false, message: errors.password });
      }
    });
  });
});

module.exports = router;
