# Morrow Market: E-Commerce Management System

A small full-stack store built with React, Spring Boot REST, Spring Data JPA, and MySQL. Customers can browse and search products, manage a cart, place cash-on-delivery orders, and view order history. Admins can manage products and order status.

## Requirements

- Java 17 or newer
- Maven 3.8 or newer
- Node.js 18 or newer and npm
- MySQL 8

## Run It

1. Start MySQL and create the database (the JDBC URL can also create it when the MySQL account has permission):

   ```sql
   CREATE DATABASE shop_db;
   ```

2. In PowerShell, configure the database account and start the API:

   ```powershell
   $env:DB_USERNAME = "root"
   $env:DB_PASSWORD = "your_mysql_password"
   cd backend
   mvn spring-boot:run
   ```

   The API starts at `http://localhost:8080`. `backend/src/main/resources/application.properties` contains the connection defaults; set `DB_URL` too if MySQL is not on the default port or host.

3. In a second PowerShell window, install frontend dependencies and start React:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

   Open the Vite URL shown in the terminal, normally `http://localhost:5173`. The frontend uses `http://localhost:8080/api` by default. Override it with `VITE_API_URL` if needed.

## Development Walkthrough

1. **Backend and database:** `backend/pom.xml` defines Spring Boot, JPA, validation, security, and the MySQL driver. `backend/src/main/resources/application.properties` supplies the database connection. Hibernate creates or updates the five entity tables on startup.
2. **Registration and login:** `model/AppUser.java`, `repository/UserRepository.java`, and `controller/AuthController.java` implement account creation and login. Passwords are BCrypt-hashed. Login uses a server session cookie; registrations always receive the `USER` role.
3. **Product management:** `model/Product.java`, `service`/`repository`, and `controller/ProductController.java` provide public listing, detail, name search, and admin-only create/update/delete operations.
4. **Cart and orders:** `CartService.java` and `OrderService.java` validate ownership and stock. Placing an order snapshots item prices, decrements stock transactionally, and clears the cart. Cancelling an order restores stock once. Payment is cash on delivery only.
5. **React pages:** `frontend/src/App.jsx` defines routes. `frontend/src/pages.jsx` contains home, login/register, listing/detail, cart, order history, and admin screens. `frontend/src/components/Shell.jsx` provides shared navigation.
6. **API connection:** `frontend/src/api.js` configures Axios with credentialed requests so the browser session cookie is sent to Spring Boot.
7. **Verification:** Run `mvn test` from `backend` and `npm run build` from `frontend`. The project is set up for these checks, but they require the versions in the Requirements section.

## Development Admin

The first startup creates a demo administrator if it does not already exist:

- Email: `admin@example.com`
- Password: `admin1234`

Change or remove this development account before deploying anywhere public. New registrations cannot grant themselves admin access.

## Database Tables

The five JPA entities create exactly these application tables:

- `users`: id, name, email, password, role
- `products`: id, name, description, price, quantity, image
- `cart`: id, user_id, product_id, quantity
- `orders`: id, user_id, total_amount, order_status, order_date
- `order_items`: id, order_id, product_id, quantity, price

The first startup also seeds four sample products. Product images use remote Unsplash URLs; replace them with your own image URLs when managing the catalog.

## REST API

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Register a customer |
| POST | `/api/auth/login` | Public | Start a session |
| GET | `/api/auth/me` | Signed in | Read current account |
| POST | `/api/auth/logout` | Signed in | End the session |
| GET | `/api/products?search=name` | Public | List or search products |
| GET | `/api/products/{id}` | Public | Product details |
| POST, PUT, DELETE | `/api/products[/{id}]` | Admin | Product CRUD |
| GET | `/api/cart` | Signed in | View the current cart |
| POST | `/api/cart/items` | Signed in | Add quantity of a product |
| DELETE | `/api/cart/items/{itemId}` | Signed in | Remove a cart line |
| POST | `/api/orders` | Signed in | Place a COD order |
| GET | `/api/orders` | Signed in | View own order history |
| GET | `/api/orders/admin` | Admin | View all customer orders |
| PATCH | `/api/orders/admin/{orderId}/status` | Admin | Update order status |

## Source Layout

```text
backend/
  src/main/java/com/shop/
    config/       Security and development seed data
    controller/   REST endpoints
    dto/          Validated request and response types
    model/        Five JPA entities and enums
    repository/   Spring Data repositories
    service/      Cart, account, and order logic
  src/main/resources/application.properties
frontend/
  src/components/Shell.jsx
  src/context/AuthContext.jsx
  src/App.jsx
  src/api.js
  src/pages.jsx
  src/styles.css
```