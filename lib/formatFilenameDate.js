/**
 * Returns a compact date-time string for filenames
 * Format: YYYYMMDD_HHMMSS
 * Example: 20251016_213045
 */
function formatFilenameDate() {
  const now = new Date();
  return now.toISOString()
    .replace(/[-:T]/g, "")   // remove -, :, and T
    .split(".")[0];          // drop milliseconds
}

module.exports = formatFilenameDate;