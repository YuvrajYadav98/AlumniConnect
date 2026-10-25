/**
 * Parses a raw `Cookie` request header into a plain object.
 * Socket.IO's handshake gives us the raw header string (unlike Express
 * routes, which already have `req.cookies` via cookie-parser) - this is
 * the same small amount of parsing cookie-parser does internally, just
 * without pulling in a second copy of that dependency for one use.
 */
const parseCookieHeader = (cookieHeader = "") => {
  const result = {};
  if (!cookieHeader) return result;

  cookieHeader.split(";").forEach((pair) => {
    const index = pair.indexOf("=");
    if (index < 0) return;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (!key) return;
    try {
      result[key] = decodeURIComponent(value);
    } catch {
      result[key] = value;
    }
  });

  return result;
};

module.exports = { parseCookieHeader };
