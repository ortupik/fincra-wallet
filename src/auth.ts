//import argon2 from 'argon2';

export const comparePassword = (plainPassword: string, hashedPassword: string | null): boolean => {
    try {
        //return await argon2.verify(hashedPassword, plainPassword);
        return hashedPassword === plainPassword;
    } catch (error) {
        console.error('Error comparing passwords:', error);
        return false;
    }
};

export const hashPassword =  (password: string): string => {
    try {
        //return await argon2.hash(password);
        return password;
    } catch (error) {
        console.error('Error hashing password:', error);
        throw new Error('Error hashing password');
    }
};

export const authenticateUser = (req: any, res: any, next: any) => {
    if (req.session.authenticatedUser) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
};

export const authorizeUser = (req: any, res: any, next: any) => {
    // Todo: Implement authorization logic here
    // Todo: Check if user has permission to access wallet endpoints
    const isAuthorized = true; 
    if (isAuthorized) {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden' });
    }
};
