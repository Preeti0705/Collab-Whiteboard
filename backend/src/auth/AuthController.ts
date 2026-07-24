import { Request, Response, Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserStore } from '../storage/UserStore';

/**
 * AuthController — Handles user registration and login.
 *
 * Endpoints:
 *   POST /api/auth/register — Create a new account
 *   POST /api/auth/login    — Log in and receive a JWT
 *
 * Security:
 *   - Passwords are hashed with bcrypt (12 salt rounds)
 *   - JWT tokens expire after 7 days
 *   - Token payload: { userId, displayName, email }
 *
 * Why bcrypt?
 *   bcrypt is intentionally slow (configurable via salt rounds),
 *   making brute-force attacks impractical. It also handles salting
 *   automatically, preventing rainbow table attacks.
 *
 * Why JWT?
 *   JWTs are stateless — the server doesn't need to store sessions.
 *   This is critical for horizontal scaling: any server instance can
 *   validate the token independently using the shared secret.
 */

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'collab-whiteboard-dev-secret-change-in-production';
const JWT_EXPIRY = '7d';

export function createAuthRouter(userStore: UserStore): Router {
  const router = Router();

  /**
   * POST /api/auth/register
   * Body: { email, displayName, password }
   * Returns: { token, user: { id, email, displayName } }
   */
  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { email, displayName, password } = req.body;

      // Validate input
      if (!email || !displayName || !password) {
        res.status(400).json({ error: 'Email, display name, and password are required' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Generate a unique user ID
      const userId = `user-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      // Create user in database
      const user = userStore.createUser(userId, email, displayName, passwordHash);
      if (!user) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, displayName: user.displayName, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );

      console.log(`✅ New user registered: ${user.displayName} (${user.email})`);

      res.status(201).json({
        token,
        user: { id: user.id, email: user.email, displayName: user.displayName },
      });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * POST /api/auth/login
   * Body: { email, password }
   * Returns: { token, user: { id, email, displayName } }
   */
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Find user
      const user = userStore.findByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Verify password
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, displayName: user.displayName, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );

      console.log(`🔑 User logged in: ${user.displayName}`);

      res.json({
        token,
        user: { id: user.id, email: user.email, displayName: user.displayName },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

// Export the secret for use in WebSocket auth
export { JWT_SECRET };
