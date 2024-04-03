"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const body_parser_1 = __importDefault(require("body-parser"));
const walletController_1 = require("./walletController"); // Import walletRouter from WalletController.ts
const app = (0, express_1.default)();
const PORT = 3000;
app.use(body_parser_1.default.json());
// Configure session middleware
app.use((0, express_session_1.default)({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));
app.use('/wallet', walletController_1.walletRouter); // Use walletRouter for '/wallet' routes
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
exports.default = app;
