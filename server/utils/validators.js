const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (email) => typeof email === "string" && EMAIL_REGEX.test(email);

const isStrongEnoughPassword = (password) =>
  typeof password === "string" && password.length >= 6;

module.exports = { isValidEmail, isStrongEnoughPassword };
