// Escapes characters that are special in a RegExp so user-typed search
// input can never be interpreted as regex syntax (which would otherwise
// let a stray "(" or "*" crash the query with an "Invalid regular
// expression" error, or let a pathological pattern degrade performance).
const escapeRegex = (str = "") => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Builds a safe, case-insensitive "contains" regex from raw user input.
// Returns null for empty/whitespace-only input so callers can skip
// adding the filter entirely.
const buildContainsRegex = (input) => {
  if (!input || !String(input).trim()) return null;
  return new RegExp(escapeRegex(String(input).trim()), "i");
};

module.exports = { escapeRegex, buildContainsRegex };
