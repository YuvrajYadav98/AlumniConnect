// Parses ?page=&limit= query params into safe, bounded numbers.
const parsePagination = (query, { defaultLimit = 20, maxLimit = 100 } = {}) => {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

module.exports = { parsePagination };
