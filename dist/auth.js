"use strict";
//import argon2 from 'argon2';
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeUser = exports.authenticateUser = exports.hashPassword = exports.comparePassword = void 0;
const comparePassword = (plainPassword, hashedPassword) => {
    try {
        //return await argon2.verify(hashedPassword, plainPassword);
        return hashedPassword === plainPassword;
    }
    catch (error) {
        console.error('Error comparing passwords:', error);
        return false;
    }
};
exports.comparePassword = comparePassword;
const hashPassword = (password) => {
    try {
        //return await argon2.hash(password);
        return password;
    }
    catch (error) {
        console.error('Error hashing password:', error);
        throw new Error('Error hashing password');
    }
};
exports.hashPassword = hashPassword;
const authenticateUser = (req, res, next) => {
    if (req.session.authenticatedUser) {
        next();
    }
    else {
        res.status(401).json({ error: 'Authentication required' });
    }
};
exports.authenticateUser = authenticateUser;
const authorizeUser = (req, res, next) => {
    // Todo: Implement authorization logic here
    // Todo: Check if user has permission to access wallet endpoints
    const isAuthorized = true;
    if (isAuthorized) {
        next();
    }
    else {
        res.status(403).json({ error: 'Forbidden' });
    }
};
exports.authorizeUser = authorizeUser;
