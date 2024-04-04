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
exports.transferFunds = exports.processDebitCreditTransaction = exports.updateBalance = exports.getBalance = exports.getUser = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const auth_1 = require("./auth");
const db = new sqlite3_1.default.Database(':memory:', (err) => __awaiter(void 0, void 0, void 0, function* () {
    if (err) {
        console.error('Error opening database:', err);
    }
    else {
        db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, pin TEXT)", (err) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                console.error('Error creating users table:', err);
            }
            else {
                const defaultPin = yield (0, auth_1.hashPassword)('1234');
                const user1Password = yield (0, auth_1.hashPassword)('password123');
                const user2Password = yield (0, auth_1.hashPassword)('password123');
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
        db.run("CREATE TABLE IF NOT EXISTS transactions_debit_credit (id INTEGER PRIMARY KEY, username TEXT, amount INTEGER, transaction_type TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");
        db.run("CREATE TABLE IF NOT EXISTS transactions_transfer (id INTEGER PRIMARY KEY, sender TEXT, receiver TEXT, amount INTEGER, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");
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
        try {
            if (!username || typeof amount !== 'number' || isNaN(amount)) {
                throw new Error('Invalid username or amount');
            }
            db.run("UPDATE wallets SET balance = balance + ? WHERE username = ?", [amount, username], (updateErr) => {
                if (updateErr) {
                    console.error('Error updating balance:', updateErr);
                    reject(updateErr);
                }
                else {
                    resolve();
                }
            });
        }
        catch (error) {
            console.error('Error updating balance:', error);
            reject(error);
        }
    });
};
exports.updateBalance = updateBalance;
const processDebitCreditTransaction = (username_1, amount_1, transactionType_1, ...args_1) => __awaiter(void 0, [username_1, amount_1, transactionType_1, ...args_1], void 0, function* (username, amount, transactionType, retries = 3) {
    let retryCount = 0;
    while (retryCount < retries) {
        try {
            yield db.run("BEGIN TRANSACTION");
            yield (0, exports.updateBalance)(username, amount);
            yield db.run("INSERT INTO transactions_debit_credit (username, amount, transaction_type) VALUES (?, ?, ?)", [username, amount, transactionType]);
            yield db.run("COMMIT");
            return;
        }
        catch (error) {
            yield db.run("ROLLBACK");
            if (error.message.includes('SQLITE_BUSY')) {
                retryCount++;
                continue;
            }
            else {
                throw error;
            }
        }
    }
    throw new Error(`Failed to process debit/credit transaction after ${retries} retries.`);
});
exports.processDebitCreditTransaction = processDebitCreditTransaction;
const transferFunds = (sender_1, receiver_1, amount_2, ...args_2) => __awaiter(void 0, [sender_1, receiver_1, amount_2, ...args_2], void 0, function* (sender, receiver, amount, retries = 3) {
    let retryCount = 0;
    while (retryCount < retries) {
        try {
            yield db.run("BEGIN IMMEDIATE");
            const senderBalance = yield (0, exports.getBalance)(sender);
            if (senderBalance < amount) {
                throw new Error('Insufficient balance');
            }
            yield (0, exports.updateBalance)(sender, -amount);
            yield (0, exports.updateBalance)(receiver, amount);
            db.run("INSERT INTO transactions_transfer (sender, receiver, amount) VALUES (?, ?, ?)", [sender, receiver, amount]);
            yield db.run("COMMIT");
            return;
        }
        catch (error) {
            yield db.run("ROLLBACK");
            if (error.message.includes('SQLITE_BUSY')) {
                retryCount++;
                continue;
            }
            else {
                throw error;
            }
        }
    }
    throw new Error(`Failed to transfer funds after ${retries} retries.`);
});
exports.transferFunds = transferFunds;
exports.default = db;
