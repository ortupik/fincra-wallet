import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import { walletRouter } from './walletController';

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

app.use('/wallet', walletRouter); 
    
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
