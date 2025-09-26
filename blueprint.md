# KOKO ProLab Blueprint

## Overview

KOKO ProLab is a two-page web application for SMM (Social Media Marketing) and software service sales. It features a user-facing page (`index.html`) for browsing and ordering services, and an admin page (`admin.html`) for managing the platform. The application will be built with vanilla HTML, CSS, and JavaScript, with all code embedded within the HTML files. It will be fully integrated with Firebase for authentication (Username/Password & Google Sign-In), database (Firestore), and file storage (Storage).

## Project Outline & Features

### Core Architecture
*   **Framework-less:** Built with HTML, CSS, and JavaScript. No external frameworks.
*   **File Structure:** Two main files: `index.html` and `admin.html`. All CSS and JS will be embedded within these files.
*   **Firebase Integration:**
    *   Firebase Authentication for user login (Username/Password, Google Sign-In).
    *   Firestore for data storage (users, products, orders, etc.).
    *   Firebase Storage for file uploads if needed.
*   **Deployment:** Intended for deployment on GitHub Pages.

### UI/UX
*   **Responsive Design:** Mobile-first approach.
*   **Theming:** Automatic light/dark mode based on device settings, with a manual toggle.
*   **Internationalization (i18n):** UI supports RTL (Arabic) and LTR (English) based on device language.
*   **Aesthetics:** Modern design with light animations, curved edges, and blur effects for pop-ups.
*   **Key UI Elements:**
    *   Top navigation bar with logo, login status, notifications, and logout button.
    *   Floating "Deposit" button.
    *   Simple live chat window.

### User Page (`index.html`)
*   **Authentication:** Users can sign up with a unique username and password, or via Google Sign-In. Username uniqueness is enforced.
*   **Service Browsing:** Services are displayed in cards, filterable by category.
*   **Ordering System:** A unified "Order Now" form for all services with fields for target link, quantity, notes, and a calculated price estimate.
*   **User Dashboard:**
    *   View active orders and their status (`pending`, `in_progress`, `completed`, `canceled`).
    *   View real account balance (starts at 0).
    *   Deposit funds via a modal with manual payment instructions.
*   **Content Sections:** About Us, Terms of Service, Privacy Policy, and user reviews.
*   **Fake Stats Section:** Displays general site statistics (e.g., total users) managed by the admin.

### Admin Page (`admin.html`)
*   **Admin Authentication:** Separate login for users with an `admin` role.
*   **Dashboard:** Overview of orders by status, incoming orders, and other key metrics.
*   **Product Management:** CRUD operations for services (products).
*   **Order Management:** View, accept, complete, cancel, and modify orders.
*   **Manual Deposits:** A form to manually update a user's balance.
*   **Payment Settings:** Interface to update payment instructions (e.g., crypto wallet addresses).
*   **User Management:** View user profiles, change tiers, verify users, and disable/delete accounts.
*   **Site Settings:** Manage "fake" stats, toggle auth methods, configure reCAPTCHA, and edit site content like policies.

### Database Schema (Firestore)
*   `users/{uid}`: Stores user profile data, role, balance, etc.
*   `products/{service_id}`: Stores service details.
*   `orders/{order_id}`: Stores order information.
*   `transactions/{tx_id}`: Logs all financial transactions.
*   `settings/site_stats`: A single document for admin-editable site statistics.
*   `reviews/{id}`: Stores user reviews.
*   `chats/{room_id}/messages/{msg_id}`: Stores chat messages.

## Current Plan: Project Setup

1.  **Create `blueprint.md`:** Document the project specifications as outlined above.
2.  **Restructure Project Files:**
    *   Delete `main.js` and `style.css`.
    *   Create `admin.html`.
    *   Clear the content of `index.html`.
3.  **Setup `index.html`:**
    *   Add basic HTML structure.
    *   Include Firebase SDK scripts from the CDN.
    *   Add the `firebaseConfig` object provided in the spec.
    *   Initialize Firebase.
    *   Create the basic layout with placeholders for: Header, Categories, Service Cards, Active Orders, and Footer.
4.  **Setup `admin.html`:**
    *   Add basic HTML structure.
5.  **Add Firebase MCP Configuration:**
    *   Create/update `.idx/mcp.json` for Firebase integration in the IDE.
