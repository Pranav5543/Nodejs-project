User Management API
This is a Node.js application that provides a RESTful API for managing user data. The API includes endpoints for creating, retrieving, updating, and deleting user records, with robust validation and error handling. The project uses Express for the server and SQLite as the database.

1. Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

Prerequisites
Node.js: Ensure you have Node.js and npm installed. You can download it from nodejs.org.

Git: You will need Git to clone the repository.

Installation

command to install all the packages:

npm install dotenv express sqlite3 uuid

Install project dependencies:

npm install

Create an environment file:
Create a file named .env in the root of the project and add the following line:

PORT=3000

Start the server:

node app.js

The server will start and connect to the SQLite database. You should see a message in your terminal confirming that it's running.

2. Project Structure
The project has been organized into a modular structure to improve readability and maintainability.

app.js: The main server file that sets up Express and defines the core routes.

routes/: Contains the userRoutes.js file, which handles all API endpoint definitions.

controllers/: Contains the userController.js file, which holds all the business logic and functions for each API endpoint.

database/: Contains the database.js file, responsible for the database connection and table initialization.

db/: A directory where the SQLite database file (user_management.db) will be stored.

postman/: This directory contains the Postman collection for testing the API.

3. Database Schema
The API uses an SQLite database with the following two tables:

managers table
This table stores a list of managers and their activity status. The database is automatically pre-filled with sample data upon startup.

manager_id: TEXT PRIMARY KEY (UUID v4)

manager_name: TEXT NOT NULL

is_active: INTEGER NOT NULL (1 for active, 0 for inactive)

users table
This table stores all user data.

user_id: TEXT PRIMARY KEY (UUID v4)

full_name: TEXT NOT NULL

mob_num: TEXT UNIQUE NOT NULL

pan_num: TEXT UNIQUE NOT NULL

manager_id: TEXT NOT NULL (Foreign Key to managers.manager_id)

created_at: TEXT NOT NULL (ISO 8601 format)

updated_at: TEXT NOT NULL (ISO 8601 format)

is_active: INTEGER NOT NULL (1 for active, 0 for inactive)

4. API Endpoints
All API endpoints are accessible via the base URL http://localhost:3000/api/users. All requests require a POST method with a JSON payload in the request body.

Endpoint

Method

Description

/create_user

POST

Creates a new user record in the database after validating the payload.

/get_users

POST

Retrieves user records. Supports optional filters by user_id, mob_num, or manager_id. If no filters are provided, it returns all active users.

/delete_user

POST

Deletes a user record based on the provided user_id or mob_num.

/update_user

POST

Updates one or more user records. It can perform a bulk update for manager_id or individual updates for other fields. When a manager_id is changed, the old user record is deactivated and a new one is created to maintain history.

/get_managers

POST

Retrieves a list of all managers and their active status.

5. How to Test the API
Important: This API is designed to handle POST requests and will not work correctly if accessed directly through a web browser. A browser sends a GET request by default, which will result in a Cannot GET / error.

To test the endpoints, you must use a tool that can send POST requests, such as Postman or cURL.

Using Postman
Import the Collection: The project includes a Postman collection file named User-Management-API.postman_collection.json in the postman/ directory. You can import this file directly into your Postman application.

Send Requests: Once imported, you will see all the pre-configured requests (Create, Get, Update, Delete). Just click on a request and press Send to test it.

6. Code Quality & Requirements
This project was developed with a focus on:

Readability: The code is modular and well-commented to ensure clarity.

Reusability: Validation logic and database functions are in separate, reusable modules.

Error Handling: All endpoints include robust checks for missing keys and invalid data, returning appropriate error messages to the client.

7. License
This project is licensed under the terms of the MIT License. Copyright (c) 2025 Pranav.
