
---

# FinCra Wallet

Welcome to FinCra Wallet! This application allows users to manage their virtual wallets, perform transactions, and check their balances.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Technical Decisions](#technical-decisions)
- [Database Decisions](#database-decisions)
- [Contributing](#contributing)
- [License](#license)

## Features

- **User Authentication:** Users can log in and log out of their accounts securely.
- **Wallet Management:** Users can view their wallet balances, credit funds, debit funds, and transfer funds to other users.
- **Secure Transactions:** Passwords are hashed for security, and transactions are performed within database transactions for data integrity.
- **Deadlock Prevention:** Deadlocks in database transactions are prevented by implementing a retry mechanism that automatically retries the transaction in case of a deadlock error.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js:** Make sure you have Node.js installed on your local machine.
- **Postman:** You'll need Postman (or similar tool) for API testing.

## Installation

To install the FinCra Wallet application, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/ortupik/fincra-wallet.git
   ```

2. Navigate to the project directory:

   ```bash
   cd fincra-wallet
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

## Usage

To run the FinCra Wallet application, follow these steps:

1. Compile TypeScript files:

   ```bash
   npx tsc
   ```

2. Start the application:

   ```bash
   node dist/app.js
   ```

The application will start running on `http://localhost:3000`.

## API Endpoints

The FinCra Wallet application exposes the following API endpoints:

- `POST /wallet/login`: Log in with username and password.
- `POST /wallet/logout`: Log out the currently authenticated user.
- `GET /wallet/balance`: Get the current balance of the authenticated user.
- `POST /wallet/credit`: Credit funds to the authenticated user's wallet.
- `POST /wallet/debit`: Debit funds from the authenticated user's wallet.
- `POST /wallet/transfer`: Transfer funds from the authenticated user's wallet to another user's wallet.

For detailed information on each endpoint and their request and response formats, refer to the API documentation or Postman collection.

## Technical Decisions

### 1. TypeScript

TypeScript was chosen as the primary language for this project due to its strong typing system, which helps catch errors during development and improves code maintainability. Additionally, TypeScript provides better IDE support and code completion, making the development process more efficient.

### 2. Express.js

Express.js was chosen as the web framework for handling HTTP requests and routing. It is lightweight, flexible, and widely used in the Node.js ecosystem. Express.js allows for easy creation of RESTful APIs and middleware integration, making it a suitable choice for building the backend of the FinCra Wallet application.

### 3. SQLite

SQLite was chosen as the database for storing user information and wallet balances. SQLite is a lightweight, file-based database that is easy to set up and does not require a separate server process. It provides sufficient performance for small to medium-sized applications and is well-suited for prototyping and development purposes.

## Database Decisions

### Transactions

All financial transactions are performed within database transactions to ensure data integrity. This ensures that operations like crediting, debiting, and transferring funds are atomic and consistent, even in the face of concurrent access.

### Locking

Pessimistic locking is used in transfer scenarios to prevent race conditions. Briefly locking the sender's balance row before reading it guarantees that another transaction hasn't modified it concurrently. This avoids situations where two transfers might succeed despite insufficient funds due to concurrent access.

### Deadlock Prevention

Deadlocks in database transactions are prevented by implementing a retry mechanism that automatically retries the transaction in case of a deadlock error. This ensures that transactions are eventually executed successfully without causing deadlock-related issues.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue if you encounter any problems or have suggestions for improvements.

## License

This project is licensed under the [MIT License](LICENSE).

--- 
