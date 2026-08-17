const { validateRegister, validateLogin } = require('../validators/authValidator');
const { registerUser, loginUser } = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { isValid, errors } = validateRegister(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors
      });
    }

    const { user, token } = await registerUser(req.body);

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: { user, token }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { isValid, errors } = validateLogin(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors
      });
    }

    const { user, token } = await loginUser(req.body);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: { user, token }
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: { user: req.user }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};
