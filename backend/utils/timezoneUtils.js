/**
 * Timezone utility functions
 * All doctor session time operations use IST (Indian Standard Time, UTC+5:30)
 */

/**
 * Get current date and time components in IST (Indian Standard Time, UTC+5:30)
 * Uses Intl.DateTimeFormat to get accurate IST time components
 * @returns {Object} Object with IST time components
 */
const getISTComponents = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(now);
  const components = {};
  parts.forEach(part => {
    components[part.type] = part.value;
  });
  
  return {
    year: parseInt(components.year),
    month: parseInt(components.month) - 1, // JavaScript months are 0-indexed
    day: parseInt(components.day),
    hour: parseInt(components.hour),
    minute: parseInt(components.minute),
    second: parseInt(components.second),
  };
};

/**
 * Get current date and time in IST (Indian Standard Time, UTC+5:30)
 * Returns a Date object created from IST components
 * @returns {Date} Current date/time in IST
 */
const getISTTime = () => {
  const components = getISTComponents();
  // Create Date object from IST components
  // Note: This creates a Date in local timezone, but with IST values
  // For comparisons, we'll use the components directly
  return new Date(
    components.year,
    components.month,
    components.day,
    components.hour,
    components.minute,
    components.second
  );
};

/**
 * Get current date in IST (start of day, 00:00:00)
 * @returns {Date} Current date in IST with time set to 00:00:00
 */
const getISTDate = () => {
  const components = getISTComponents();
  return new Date(components.year, components.month, components.day, 0, 0, 0, 0);
};

/**
 * Get current hour and minute in IST
 * @returns {Object} Object with hour and minute properties
 */
const getISTHourMinute = () => {
  const components = getISTComponents();
  return {
    hour: components.hour,
    minute: components.minute,
  };
};

/**
 * Get current time in minutes (from midnight) in IST
 * @returns {Number} Current time in minutes from midnight (IST)
 */
const getISTTimeInMinutes = () => {
  const components = getISTComponents();
  return components.hour * 60 + components.minute;
};

module.exports = {
  getISTTime,
  getISTDate,
  getISTHourMinute,
  getISTTimeInMinutes,
};

