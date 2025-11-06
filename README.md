# 🍸 Birch Lounge - Cocktail Recipe Manager

A modern, professional-grade cocktail recipe management application built with React 19, featuring AI-powered recipe suggestions, batch scaling, menu building, and comprehensive inventory management.

## ✨ Features

### 🎯 Core Functionality

- **Recipe Management**: Create, edit, and organize cocktail recipes with detailed ingredients and instructions
- **Ingredient Inventory**: Track pricing, categories, and availability of bar ingredients
- **Menu Builder**: Create and manage cocktail menus for events and establishments
- **Batch Scaling**: Scale recipes for large events (1-1000+ servings) with cost calculations
- **AI Assistant**: Gemini AI integration for recipe suggestions and variations
- **Service Mode**: Bartender-focused interface for quick recipe lookup during service

### 🎨 User Experience

- **Dark/Light Theme**: Seamless theme switching with system preference detection
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: WCAG compliant with comprehensive ARIA support
- **Contextual Keyboard Support**: Input-level shortcuts for efficient navigation
- **Toast Notifications**: Non-intrusive feedback for user actions
- **Error Boundaries**: Graceful error handling with recovery options

### 🔧 Technical Excellence

- **Modern React**: Built with React 19 and functional components
- **Performance Optimized**: Memoization, debouncing, and efficient re-renders
- **Type Safety**: Comprehensive validation and error handling
- **Modular Architecture**: Clean separation of concerns and reusable components
- **Testing**: Unit tests with Vitest and React Testing Library
- **Documentation**: README and in-app guidance (Storybook coverage planned)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/birch-lounge-app.git
cd birch-lounge-app

# Install dependencies
yarn install

# Start development server
yarn dev
```

The application will be available at `http://localhost:3000`

## 📖 Usage Guide

### Recipe Management

1. **Create Recipe**: Click "New Recipe" to open the recipe form
2. **Add Ingredients**: Use the dynamic ingredient list with auto-complete
3. **Set Details**: Add instructions, glassware, garnish, and flavor profiles
4. **Save & Organize**: Recipes are automatically saved and categorized

### Menu Building

1. **Navigate to Menus**: Use the menu tab in the main navigation
2. **Add Recipes**: Drag recipes from the available list to your menu
3. **Calculate Costs**: View real-time cost calculations and statistics
4. **Save & Print**: Save menus for later use or print for service

## 🏗️ Architecture

### Project Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── features/              # Feature-specific components
│   └── MainApp.jsx           # Main application layout
├── context/                   # React Context for state management
├── hooks/                     # Custom React hooks
├── services/                  # External service integrations
├── utils/                     # Utility functions
├── constants/                 # Application constants
├── models/                    # Data models and validation
├── data/                      # Initial data and fixtures
└── test/                      # Test utilities and setup
```

### Key Technologies

- **React 19**: Latest React with concurrent features
- **Tailwind CSS v4**: Utility-first CSS framework
- **Vite**: Fast build tool and development server
- **Lucide React**: Beautiful, customizable icons
- **Vitest**: Fast unit testing framework
- **Shadcn/UI**: Component primitives for consistent styling
