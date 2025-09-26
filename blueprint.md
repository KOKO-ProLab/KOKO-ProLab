# KOKO ProLab Blueprint

## Overview

KOKO ProLab is a web application designed to be a comprehensive platform for social media engagement services. It allows users to browse and order services, track their order status, and interact with support via a live chat. The platform supports both Google-based and unique username-based authentication and features a modern, responsive design with light and dark themes.

## Implemented Features

### Authentication
- **Google Sign-In:** Users can register and log in using their Google accounts.
- **Unique Username Login:** New users can create an account by choosing a unique username, which provides an anonymous but personalized experience.
- **Session Management:** The application state dynamically changes based on the user's login status, showing or hiding relevant sections like order history and chat.

### User Interface
- **Responsive Design:** The layout adapts to various screen sizes, ensuring a seamless experience on both desktop and mobile devices.
- **Light/Dark Mode:** Users can toggle between light and dark themes for visual comfort.
- **Interactive Modals:** Login and order forms are presented in clean, user-friendly modals.
- **Dynamic Content Loading:** Service categories, user orders, and chat messages are loaded dynamically from Firestore.

### Core Functionality
- **Service Categories:** The homepage displays a grid of available service categories, which are fetched from the `services` collection in Firestore.
- **Order Placement:** Authenticated users can place orders for services through a modal form. Orders include a link and quantity, and are stored in the `orders` collection with a `pending` status.
- **Order Status Tracking:** Users can view a list of their past orders and their current status (e.g., pending, completed).
- **Live Chat:** A floating chat widget allows users to communicate in real-time. Messages are stored in the `chat` collection.

### Styling and Design
- **Modern Aesthetics:** The application uses a modern design language with clean lines, ample spacing, and a clear visual hierarchy.
- **CSS Variables:** The stylesheet leverages CSS variables for easy theming and maintenance.
- **Interactive Elements:** Buttons and cards have hover effects to provide visual feedback.

## Current Plan

This is the initial version of the KOKO ProLab application. The current plan is to continue developing the core features and improving the user experience. Future enhancements may include:

- **Admin Panel:** A dedicated interface for administrators to manage services, orders, and users.
- **Payment Integration:** A system for users to deposit funds into their accounts.
- **User Profiles:** Expanded user profiles with order history and account settings.
- **Notifications:** Real-time notifications for order status updates.
