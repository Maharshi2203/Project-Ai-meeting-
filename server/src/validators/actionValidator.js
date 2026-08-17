const VALID_PRIORITIES = ['Low', 'Medium', 'High'];
const VALID_STATUSES = ['Open', 'In Progress', 'Blocked', 'Completed'];

const validateActionItem = (data) => {
  const { task, priority, status } = data;
  const errors = [];

  if (!task || typeof task !== 'string' || !task.trim()) {
    errors.push('Action item task description is required.');
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  if (status && !VALID_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  VALID_PRIORITIES,
  VALID_STATUSES,
  validateActionItem
};
