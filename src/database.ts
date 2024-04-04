import sqlite3 from 'sqlite3';
import { hashPassword } from './auth';

const db = new sqlite3.Database(':memory:', async (err: Error | null) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, pin TEXT)", async (err: Error | null) => {
          if (err) {
            console.error('Error creating users table:', err);
          } else {
            const defaultPin = await hashPassword('1234'); 
            const user1Password = await hashPassword('password123');
            const user2Password = await hashPassword('password123');
            db.run("INSERT OR IGNORE INTO users (username, password, pin) VALUES (?, ?, ?)", ['user1', user1Password, defaultPin]);
            db.run("INSERT OR IGNORE INTO users (username, password, pin) VALUES (?, ?, ?)", ['user2', user2Password, defaultPin]);
          }
        });

        db.run("CREATE TABLE IF NOT EXISTS wallets (id INTEGER PRIMARY KEY, username TEXT UNIQUE, balance INTEGER DEFAULT 0, pin TEXT)", async (err: Error | null) => {
          if (err) {
              console.error('Error creating wallets table:', err);
            } else {
              db.run("INSERT OR IGNORE INTO wallets (username, balance, pin) VALUES (?, ?, ?)", ['user1', 0, '1234']);
              db.run("INSERT OR IGNORE INTO wallets (username, balance, pin) VALUES (?, ?, ?)", ['user2', 0, '1234']);
            }
      });

      db.run("CREATE TABLE IF NOT EXISTS transactions_debit_credit (id INTEGER PRIMARY KEY, username TEXT, amount INTEGER, transaction_type TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");
      db.run("CREATE TABLE IF NOT EXISTS transactions_transfer (id INTEGER PRIMARY KEY, sender TEXT, receiver TEXT, amount INTEGER, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");

    }
});

export const getUser = (username: string): Promise<{ username: string, password: string, pin: string } | null> => {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE username = ?", [username], (err: Error | null, row: any) => {
            if (err) {
                console.error('Error getting user:', err);
                reject(err);
            } else {
                resolve(row ? { username: row.username, password: row.password, pin: row.pin } : null);
            }
        });
    });
};

export const getBalance = (username: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM wallets where username = ?",[username], (err: Error | null, row: any) => {
            if (err) {
                console.error('Error getting balance:', err);
                reject(err);
            } else {
                resolve(row ? row.balance : 0);
            }
        });
    });
};

export const updateBalance = (username: string, amount: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            if (!username || typeof amount !== 'number' || isNaN(amount)) {
                throw new Error('Invalid username or amount');
            }

            db.run("UPDATE wallets SET balance = balance + ? WHERE username = ?", [amount, username], (updateErr: Error | null) => {
                if (updateErr) {
                    console.error('Error updating balance:', updateErr);
                    reject(updateErr);
                } else {
                    resolve();
                }
            });

        } catch (error) {
            console.error('Error updating balance:', error);
            reject(error);
        }
    });
};

export const processDebitCreditTransaction = async (
    username: string,
    amount: number,
    transactionType: string
): Promise<void> => {
    try {
        await db.run("BEGIN TRANSACTION");

        await updateBalance(username, amount);

        await db.run("INSERT INTO transactions_debit_credit (username, amount, transaction_type) VALUES (?, ?, ?)", [username, amount, transactionType]);

        await db.run("COMMIT");
    } catch (error) {
        await db.run("ROLLBACK");
        console.error('Error processing debit/credit transaction:', error);
        throw error;
    }
};

export const transferFunds = async (
    sender: string,
    receiver: string,
    amount: number
): Promise<void> => {
    try {
        await db.run("BEGIN IMMEDIATE");
        const senderBalance = await getBalance(sender);
        
        if (senderBalance < amount) {
            throw new Error('Insufficient balance');
        }
        
        await updateBalance(sender, -amount); 
        await updateBalance(receiver, amount); 
          
        db.run("INSERT INTO transactions_transfer (sender, receiver, amount) VALUES (?, ?, ?)", [sender, receiver, amount]);
       
        console.log(`Transaction recorded: ${sender} transferred ${amount} to ${receiver}`);

        await db.run("COMMIT"); 
    } catch (error) {
        await db.run("ROLLBACK"); 
        console.error('Error transferring funds:', error);
        throw error;
    }
};

export default db;
