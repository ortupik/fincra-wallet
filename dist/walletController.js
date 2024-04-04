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
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletRouter = void 0;
const database_1 = require("./database");
const auth_1 = require("./auth");
exports.walletRouter = require('express').Router();
let isUpdatingBalance = false;
const lock = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (isUpdatingBalance) {
        res.status(503).json({ error: 'Service temporarily unavailable' });
        return;
    }
    isUpdatingBalance = true;
    try {
        yield next();
    }
    finally {
        isUpdatingBalance = false;
    }
});
exports.walletRouter.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
    }
    const userData = yield (0, database_1.getUser)(username);
    if (!userData || !(yield (0, auth_1.comparePassword)(password, userData.password))) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
    }
    req.session.authenticatedUser = username;
    res.json({ message: 'Login successful' });
}));
exports.walletRouter.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
        else {
            res.json({ message: 'Logout successful' });
        }
    });
});
exports.walletRouter.get('/balance', lock, auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.session.authenticatedUser;
        if (!user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const balance = yield (0, database_1.getBalance)(user);
        res.json({ balance });
    }
    catch (error) {
        console.error('Error getting balance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.walletRouter.post('/credit', lock, auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { amount, pin } = req.body;
    if (!amount || typeof amount !== 'number' || amount <= 0 || !pin) {
        res.status(400).json({ error: 'Invalid amount or pin' });
        return;
    }
    try {
        const user = (_a = req.session) === null || _a === void 0 ? void 0 : _a.authenticatedUser;
        if (!user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        if (!verifyPin(user, pin)) {
            res.status(401).json({ error: 'Invalid pin' });
            return;
        }
        yield performCreditTransaction(user, amount, res);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.walletRouter.post('/debit', lock, auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const { amount, pin } = req.body;
    if (!amount || typeof amount !== 'number' || amount <= 0 || !pin) {
        res.status(400).json({ error: 'Invalid amount or pin' });
        return;
    }
    try {
        const user = (_b = req.session) === null || _b === void 0 ? void 0 : _b.authenticatedUser;
        if (!user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        if (!verifyPin(user, pin)) {
            res.status(401).json({ error: 'Invalid pin' });
            return;
        }
        yield performDebitTransaction(user, amount, res);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.walletRouter.post('/transfer', lock, auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const { receiver, amount, pin } = req.body;
    if (!receiver || !amount || typeof amount !== 'number' || amount <= 0 || !pin) {
        res.status(400).json({ error: 'Invalid receiver, amount, or pin' });
        return;
    }
    try {
        const sender = (_c = req.session) === null || _c === void 0 ? void 0 : _c.authenticatedUser;
        if (!sender) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        if (!verifyPin(sender, pin)) {
            res.status(401).json({ error: 'Invalid pin' });
            return;
        }
        yield performTransferTransaction(sender, receiver, amount, res);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
const verifyPin = (username, pin) => __awaiter(void 0, void 0, void 0, function* () {
    const savedPin = yield getUserPin(username);
    return yield (0, auth_1.comparePassword)(pin, savedPin);
});
const getUserPin = (username) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = (0, database_1.getUser)(username);
    return (yield userData) ? ((yield userData).pin) : null;
});
const performCreditTransaction = (user, amount, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, database_1.updateBalance)(user, amount);
        res.json({ message: `Wallet credited with ${amount}` });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
const performDebitTransaction = (user, amount, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, database_1.updateBalance)(user, -amount);
        res.json({ message: `Wallet debited with ${amount}` });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
const performTransferTransaction = (sender, receiver, amount, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const senderBalance = yield (0, database_1.getBalance)(sender);
        if (senderBalance < amount) {
            res.status(400).json({ error: 'Insufficient balance' });
            return;
        }
        yield (0, database_1.transferFunds)(sender, receiver, amount);
        res.json({ message: `Funds transferred successfully to ${receiver}` });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
