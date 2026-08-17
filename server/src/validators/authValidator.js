const validateRegister = (data) => {
  const { name, email, password, confirmPassword } = data;
  const errors = [];

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Full name is required.');
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email address is required.');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Please enter a valid email address.');
    }
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }

  if (password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateLogin = (data) => {
  const { email, password } = data;
  const errors = [];

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email address is required.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateRegister,
  validateLogin
};
