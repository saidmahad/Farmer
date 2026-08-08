// utils/validate.js
// Small dependency-free validators for registration/login input.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistration({ name, email, password }) {
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters.');
  }
  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    errors.push('A valid email address is required.');
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push('Password must be at least 8 characters.');
  }

  return errors;
}

function validateLogin({ email, password }) {
  const errors = [];
  if (!email || !EMAIL_RE.test(String(email).trim())) {
    errors.push('A valid email address is required.');
  }
  if (!password) {
    errors.push('Password is required.');
  }
  return errors;
}

module.exports = { validateRegistration, validateLogin };
