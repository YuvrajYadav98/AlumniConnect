// @desc    Simple health check to confirm the API is running
// @route   GET /api/health
// @access  Public
const getHealthStatus = (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "AlumniConnect API is running",
    timestamp: new Date().toISOString(),
  });
};

module.exports = { getHealthStatus };
