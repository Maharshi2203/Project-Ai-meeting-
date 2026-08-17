const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_ai_meeting_notes_tracker_jwt_key_2026';

async function registerUser({ name, email, password }) {
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });

  if (existingUser) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    error.isPublic = true;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true
    }
  });

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  return { user, token };
}

async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    error.isPublic = true;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    error.isPublic = true;
    throw error;
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    },
    token
  };
}

module.exports = {
  registerUser,
  loginUser
};
