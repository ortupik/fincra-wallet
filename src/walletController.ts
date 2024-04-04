import { Request, Response } from 'express';
import { getBalance, updateBalance, transferFunds, getUser} from './database';
import { authenticateUser, comparePassword } from './auth';

export const walletRouter = require('express').Router();

let isUpdatingBalance = false;

const lock = async (req: Request, res: Response, next: () => void) => {
    if (isUpdatingBalance) {
        res.status(503).json({ error: 'Service temporarily unavailable' });
        return;
    }
    isUpdatingBalance = true;
    try {
        await next();
    } finally {
        isUpdatingBalance = false;
    }
};

walletRouter.post('/login', async (req: Request | any, res: Response) => {
  const { username, password } = req.body; 
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }
  const userData = await getUser(username);
  if (!userData || !(await comparePassword(password, userData.password))) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }
  req.session.authenticatedUser = username;
  res.json({ message: 'Login successful' });
});

walletRouter.post('/logout', (req: Request | any, res: Response) => {
  req.session.destroy((err: any) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'Logout successful' });
    }
  });
});

walletRouter.get('/balance', lock, authenticateUser, async (req: Request | any, res: Response) => {
  try {
      const user = req.session.authenticatedUser;
      if (!user) {
          res.status(401).json({ error: 'User not authenticated' });
          return;
      }
      const balance = await getBalance(user);
      res.json({ balance });
  } catch (error) {
      console.error('Error getting balance:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

walletRouter.post('/credit', lock, authenticateUser, async (req: Request | any, res: Response) => {
    const { amount, pin } = req.body;
    if (!amount || typeof amount !== 'number' || amount <= 0 || !pin) {
        res.status(400).json({ error: 'Invalid amount or pin' });
        return;
    }
    try {
        const user = req.session?.authenticatedUser;
        if (!user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        if (!verifyPin(user, pin)) {
            res.status(401).json({ error: 'Invalid pin' });
            return;
        }
        await performCreditTransaction(user, amount, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

walletRouter.post('/debit', lock, authenticateUser, async (req: Request | any, res: Response) => {
    const { amount, pin } = req.body;
    if (!amount || typeof amount !== 'number' || amount <= 0 || !pin) {
        res.status(400).json({ error: 'Invalid amount or pin' });
        return;
    }
    try {
        const user = req.session?.authenticatedUser;
        if (!user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        if (!verifyPin(user, pin)) {
            res.status(401).json({ error: 'Invalid pin' });
            return;
        }
        await performDebitTransaction(user, amount, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

walletRouter.post('/transfer', lock, authenticateUser, async (req: Request | any, res: Response) => {
    const { receiver, amount, pin } = req.body;
    if (!receiver || !amount || typeof amount !== 'number' || amount <= 0 || !pin) {
        res.status(400).json({ error: 'Invalid receiver, amount, or pin' });
        return;
    }
    try {
        const sender = req.session?.authenticatedUser;
        if (!sender) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        if (!verifyPin(sender, pin)) {
            res.status(401).json({ error: 'Invalid pin' });
            return;
        }
        await performTransferTransaction(sender, receiver, amount, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const verifyPin = async (username: string, pin: string): Promise<boolean> => {
    const savedPin = await getUserPin(username); 
    return await comparePassword(pin, savedPin); 
};

const  getUserPin = async (username: string): Promise<string> => {
    const userData = getUser(username);
    return await userData ? ((await userData).pin) : null;
};

const performCreditTransaction = async (user: string, amount: number, res: Response) => {
    try {
        await updateBalance(user, amount);
        res.json({ message: `Wallet credited with ${amount}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const performDebitTransaction = async (user: string, amount: number, res: Response) => {
    try {
        await updateBalance(user, -amount);
        res.json({ message: `Wallet debited with ${amount}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const performTransferTransaction = async (sender: string, receiver: string, amount: number, res: Response) => {
    try {
        const senderBalance = await getBalance(sender);
        if (senderBalance < amount) {
            res.status(400).json({ error: 'Insufficient balance' });
            return;
        }
        await transferFunds(sender, receiver, amount);
        res.json({ message: `Funds transferred successfully to ${receiver}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
