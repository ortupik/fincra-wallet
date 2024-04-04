
# FinCra Wallet

Welcome to FinCra Wallet! This application allows users to manage their virtual wallets, perform transactions, and check their balances.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Technical Decisions](#technical-decisions)
- [Contributing](#contributing)
- [License](#license)

## Features

- **User Authentication:** Users can log in and log out of their accounts securely.
- **Wallet Management:** Users can view their wallet balances, credit funds, debit funds, and transfer funds to other users.
- **Secure Transactions:** Passwords are hashed for security, and transactions are performed within database transactions for data integrity.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js:** Make sure you have Node.js installed on your local machine.
- **Postman:** You'll need Postman (or similar tool) for API testing.

## Installation

To install the FinCra Wallet application, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://gitlab.com/chrispchemut/fincra-wallet.git
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

### 4. Bcrypt.js

Bcrypt.js was chosen as the library for hashing passwords before storing them in the database. Bcrypt.js provides secure password hashing with a customizable cost factor, making it resistant to brute-force attacks. By securely hashing passwords, the FinCra Wallet application ensures the confidentiality of user credentials and protects against unauthorized access.

### 5. Session Management

Express.js session management middleware was used to manage user sessions and authenticate requests. Sessions are stored in memory by default but can be configured to use external stores like Redis for scalability. By maintaining user sessions, the FinCra Wallet application can keep track of authenticated users and restrict access to certain endpoints based on authentication status.

These technical decisions were made to ensure the security, performance, and maintainability of the FinCra Wallet application while providing a seamless user experience.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue if you encounter any problems or have suggestions for improvements.

## License

This project is licensed under the [MIT License](LICENSE).

--- 
