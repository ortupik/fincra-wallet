import sqlite3 from 'sqlite3';
import { hashPassword } from './auth';

const db = new sqlite3.Database(':memory:', async (err: Error | null) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Database opened successfully');

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
      db.run("BEGIN TRANSACTION", async (beginErr: Error | null) => {
          if (beginErr) {
              console.error('Error beginning transaction:', beginErr);
              reject(beginErr);
              return;
          }

          try {
              if (!username || typeof amount !== 'number' || isNaN(amount)) {
                  throw new Error('Invalid username or amount');
              }

              await db.run("UPDATE wallets SET balance = balance + ? WHERE username = ?", [amount, username]);

              await db.run("COMMIT", (commitErr: Error | null) => {
                  if (commitErr) {
                      console.error('Error committing transaction:', commitErr);
                      reject(commitErr);
                  } else {
                      resolve();
                  }
              });
          } catch (error) {
              await db.run("ROLLBACK");
              console.error('Error updating balance:', error);
              reject(error);
          }
      });
  });
};


export const updateBalancesAndRecordTransaction = (
    sender: string,
    receiver: string,
    amount: number
): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION", (beginErr: Error | null) => {
                if (beginErr) {
                    console.error('Error beginning transaction:', beginErr);
                    reject(beginErr);
                } else {
                    db.get("SELECT balance FROM wallets WHERE username = ?", [sender], (balanceErr: Error | null, senderRow: any) => {
                        if (balanceErr) {
                            console.error('Error getting sender balance:', balanceErr);
                            reject(balanceErr);
                        } else {
                            const senderBalance = senderRow ? senderRow.balance : 0;
                            if (senderBalance < amount) {
                                console.error('Insufficient balance');
                                reject(new Error('Insufficient balance'));
                            } else {
                                db.run("UPDATE wallets SET balance = balance - ? WHERE username = ?", [amount, sender], (senderUpdateErr: Error | null) => {
                                    if (senderUpdateErr) {
                                        console.error('Error updating sender balance:', senderUpdateErr);
                                        reject(senderUpdateErr);
                                    } else {
                                        db.run("UPDATE wallets SET balance = balance + ? WHERE username = ?", [amount, receiver], (receiverUpdateErr: Error | null) => {
                                            if (receiverUpdateErr) {
                                                console.error('Error updating receiver balance:', receiverUpdateErr);
                                                reject(receiverUpdateErr);
                                            } else {
                                                console.log(`Transaction recorded: ${sender} transferred ${amount} to ${receiver}`);
                                                db.run("COMMIT", (commitErr: Error | null) => {
                                                    if (commitErr) {
                                                        console.error('Error committing transaction:', commitErr);
                                                        reject(commitErr);
                                                    } else {
                                                        resolve();
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
            });
        });
    });
};

export default db;
