// Parses optional ?from=&to= query params (ISO date strings) into a
// Mongo-ready range object, e.g. { $gte, $lte }. Returns null for any
// side that's missing/invalid so callers can decide their own default
// (usually "no filter" or "last N months").
const parseDateRange = (query, { defaultDays } = {}) => {
  let from = query.from ? new Date(query.from) : null;
  let to = query.to ? new Date(query.to) : null;

  if (from && Number.isNaN(from.getTime())) from = null;
  if (to && Number.isNaN(to.getTime())) to = null;

  // Include the entire "to" day rather than cutting off at midnight.
  if (to) to.setHours(23, 59, 59, 999);

  if (!from && !to && defaultDays) {
    to = new Date();
    from = new Date();
    from.setDate(from.getDate() - defaultDays);
  }

  const range = {};
  if (from) range.$gte = from;
  if (to) range.$lte = to;

  return { from, to, range: Object.keys(range).length ? range : null };
};

module.exports = { parseDateRange };
