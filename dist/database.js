"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBalancesAndRecordTransaction = exports.updateBalance = exports.getBalance = exports.getUser = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const auth_1 = require("./auth");
const db = new sqlite3_1.default.Database(':memory:', (err) => __awaiter(void 0, void 0, void 0, function* () {
    if (err) {
        console.error('Error opening database:', err);
    }
    else {
        console.log('Database opened successfully');
        db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, pin TEXT)", (err) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                console.error('Error creating users table:', err);
            }
            else {
                const defaultPin = yield (0, auth_1.hashPassword)('1234'); // Hash the default pin
                const user1Password = yield (0, auth_1.hashPassword)('password123');
                const user2Password = yield (0, auth_1.hashPassword)('securePassword456');
                db.run("INSERT OR IGNORE INTO users (username, password, pin) VALUES (?, ?, ?)", ['user1', user1Password, defaultPin]);
                db.run("INSERT OR IGNORE INTO users (username, password, pin) VALUES (?, ?, ?)", ['user2', user2Password, defaultPin]);
            }
        }));
        db.run("CREATE TABLE IF NOT EXISTS wallets (id INTEGER PRIMARY KEY, username TEXT UNIQUE, balance INTEGER DEFAULT 0, pin TEXT)", (err) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                console.error('Error creating wallets table:', err);
            }
            else {
                db.run("INSERT OR IGNORE INTO wallets (username, balance, pin) VALUES (?, ?, ?)", ['user1', 0, '1234']);
                db.run("INSERT OR IGNORE INTO wallets (username, balance, pin) VALUES (?, ?, ?)", ['user2', 0, '1234']);
            }
        }));
    }
}));
const getUser = (username) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
            if (err) {
                console.error('Error getting user:', err);
                reject(err);
            }
            else {
                resolve(row ? { username: row.username, password: row.password, pin: row.pin } : null);
            }
        });
    });
};
exports.getUser = getUser;
const getBalance = (username) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM wallets where username = ?", [username], (err, row) => {
            if (err) {
                console.error('Error getting balance:', err);
                reject(err);
            }
            else {
                resolve(row ? row.balance : 0);
            }
        });
    });
};
exports.getBalance = getBalance;
const updateBalance = (username, amount) => {
    return new Promise((resolve, reject) => {
        db.run("UPDATE wallets SET balance = balance + ? WHERE username = ?", [amount, username], (err) => {
            if (err) {
                console.error('Error updating balance:', err);
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
};
exports.updateBalance = updateBalance;
const updateBalancesAndRecordTransaction = (sender, receiver, amount) => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION", (beginErr) => {
                if (beginErr) {
                    console.error('Error beginning transaction:', beginErr);
                    reject(beginErr);
                }
                else {
                    db.get("SELECT balance FROM wallets WHERE username = ?", [sender], (balanceErr, senderRow) => {
                        if (balanceErr) {
                            console.error('Error getting sender balance:', balanceErr);
                            reject(balanceErr);
                        }
                        else {
                            const senderBalance = senderRow ? senderRow.balance : 0;
                            if (senderBalance < amount) {
                                console.error('Insufficient balance');
                                reject(new Error('Insufficient balance'));
                            }
                            else {
                                db.run("UPDATE wallets SET balance = balance - ? WHERE username = ?", [amount, sender], (senderUpdateErr) => {
                                    if (senderUpdateErr) {
                                        console.error('Error updating sender balance:', senderUpdateErr);
                                        reject(senderUpdateErr);
                                    }
                                    else {
                                        db.run("UPDATE wallets SET balance = balance + ? WHERE username = ?", [amount, receiver], (receiverUpdateErr) => {
                                            if (receiverUpdateErr) {
                                                console.error('Error updating receiver balance:', receiverUpdateErr);
                                                reject(receiverUpdateErr);
                                            }
                                            else {
                                                console.log(`Transaction recorded: ${sender} transferred ${amount} to ${receiver}`);
                                                db.run("COMMIT", (commitErr) => {
                                                    if (commitErr) {
                                                        console.error('Error committing transaction:', commitErr);
                                                        reject(commitErr);
                                                    }
                                                    else {
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
exports.updateBalancesAndRecordTransaction = updateBalancesAndRecordTransaction;
exports.default = db;
