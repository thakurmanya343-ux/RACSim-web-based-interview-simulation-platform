const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { users, candidates } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'racsim_jwt_secret_internal_hackathon_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Register a new user (candidate, expert, or admin).
 */
function register({ name, email, password, role = 'candidate', candidateId = null }) {
  if (!name || !email || !password) {
    throw new Error("Missing required fields: 'name', 'email', and 'password' are required.");
  }

  const existing = users.getByEmail(email);
  if (existing) {
    throw new Error(`A user with email '${email}' already exists.`);
  }

  const validRoles = ['candidate', 'expert', 'admin'];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role '${role}'. Must be one of: ${validRoles.join(', ')}`);
  }

  // If registering as a candidate and no candidateId provided, link or create candidate profile
  let targetCandidateId = candidateId;
  if (role === 'candidate' && !targetCandidateId) {
    targetCandidateId = `cand-${Date.now()}`;
    candidates.updateProfile(targetCandidateId, {
      name,
      skills: ['Python', 'Machine Learning', 'Computer Vision'],
      appliedPost: 'post-scientist-b-ai',
    });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const createdUser = users.create({
    id: userId,
    name,
    email: email.toLowerCase().trim(),
    password_hash: passwordHash,
    role,
    candidateId: targetCandidateId,
  });

  const token = jwt.sign(
    {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role,
      candidateId: createdUser.candidateId,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    user: createdUser,
    token,
  };
}

/**
 * Authenticates user credentials and returns JWT token.
 */
function login({ email, password }) {
  if (!email || !password) {
    throw new Error("Missing required fields: 'email' and 'password' are required.");
  }

  const user = users.getByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      candidateId: user.candidateId,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      candidateId: user.candidateId,
      createdAt: user.createdAt,
    },
    token,
  };
}

/**
 * Verifies JWT token and returns payload.
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired authentication token.');
  }
}

module.exports = {
  register,
  login,
  verifyToken,
  JWT_SECRET,
};
