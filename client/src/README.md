# SupplyMitraLink - Frontend Structure

This document outlines the organized folder structure for the SupplyMitraLink React application.

## 📁 Folder Structure

```
src/
├── components/           # React components organized by feature
│   ├── common/          # Shared/reusable components
│   │   ├── Header/      # Header components
│   │   │   ├── SupplierHeader.jsx
│   │   │   └── VendorHeader.jsx
│   │   ├── LanguageSwitcher/  # Language switching component
│   │   │   └── LanguageSwitcher.jsx
│   │   ├── Loading/     # Loading states
│   │   │   └── LoadingSpinner.jsx
│   │   └── ErrorBoundary/  # Error handling
│   │       └── ErrorBoundary.jsx
│   ├── auth/            # Authentication related components
│   │   ├── Login/       # Login component
│   │   │   └── Login.jsx
│   │   └── ProtectedRoute/  # Route protection
│   │       └── ProtectedRoute.jsx
│   ├── supplier/        # Supplier-specific components
│   │   ├── Dashboard/   # Supplier dashboard
│   │   │   └── SupplierDashboard.jsx
│   │   ├── Profile/     # Supplier profile (to be moved)
│   │   ├── Items/       # Inventory management (to be moved)
│   │   ├── Map/         # Supplier map (to be moved)
│   │   └── PublicView/  # Public supplier view (to be moved)
│   ├── vendor/          # Vendor-specific components
│   │   ├── Dashboard/   # Vendor dashboard (to be moved)
│   │   ├── Profile/     # Vendor profile (to be moved)
│   │   ├── Map/         # Vendor map (to be moved)
│   │   └── Checkout/    # Checkout process (to be moved)
│   ├── orders/          # Order-related components
│   │   ├── OrderConfirmation/  # Order confirmation (to be moved)
│   │   └── PriceWarnings/      # Price alerts (to be moved)
│   └── feedback/        # Feedback components (to be moved)
├── features/            # Feature-based organization (future)
│   ├── auth/           # Authentication features
│   ├── supplier/       # Supplier features
│   ├── vendor/         # Vendor features
│   └── orders/         # Order features
├── hooks/              # Custom React hooks
├── stores/             # Zustand state management
├── services/           # API services and external integrations
│   └── api.js         # Centralized API service
├── utils/              # Utility functions and helpers
│   ├── constants.js   # Application constants
│   └── helpers.js     # Helper functions
├── constants/          # Additional constants (future)
├── types/              # TypeScript types (future)
├── styles/             # Global styles and CSS
├── assets/             # Static assets (images, icons, etc.)
├── i18n/               # Internationalization
│   ├── index.js       # i18n configuration
│   └── locales/       # Translation files
│       ├── en.json
│       ├── hi.json
│       └── te.json
├── contexts/           # React contexts
├── pages/              # Page-level components
├── App.jsx            # Main App component
├── main.jsx           # Application entry point
└── index.css          # Global CSS
```

## 🏗️ Architecture Principles

### 1. **Feature-Based Organization**
Components are organized by feature rather than type, making it easier to:
- Find related code quickly
- Maintain feature isolation
- Scale the application efficiently

### 2. **Common Components**
Shared components are placed in `components/common/` to:
- Avoid code duplication
- Ensure consistency across the app
- Simplify maintenance

### 3. **Separation of Concerns**
- **Components**: UI logic and presentation
- **Services**: API calls and external integrations
- **Utils**: Helper functions and utilities
- **Stores**: State management
- **Hooks**: Reusable logic

## 📦 Component Organization

### Common Components (`components/common/`)
- **Header**: Navigation and branding components
- **LanguageSwitcher**: Multi-language support
- **Loading**: Loading states and spinners
- **ErrorBoundary**: Error handling and fallbacks

### Feature Components
- **Auth**: Login, signup, and route protection
- **Supplier**: All supplier-related functionality
- **Vendor**: All vendor-related functionality
- **Orders**: Order management and tracking
- **Feedback**: Rating and review system

## 🔧 Utilities and Services

### API Service (`services/api.js`)
Centralized API handling with:
- Automatic token management
- Error handling
- Request/response interceptors
- Timeout handling

### Helper Functions (`utils/helpers.js`)
Common utility functions:
- Date formatting
- Currency formatting
- Validation helpers
- File handling
- Distance calculations

### Constants (`utils/constants.js`)
Application-wide constants:
- API configuration
- User roles
- Order statuses
- Validation rules
- Error messages

## 🚀 Migration Guide

### Moving Existing Components

1. **Identify the component's feature area**
2. **Create the appropriate folder structure**
3. **Move the component file**
4. **Update import paths**
5. **Update the main index.js export**

### Example Migration

```bash
# Before
src/components/SupplierDashboard.jsx

# After
src/components/supplier/Dashboard/SupplierDashboard.jsx
```

### Updating Imports

```javascript
// Before
import SupplierDashboard from './components/SupplierDashboard';

// After
import SupplierDashboard from './components/supplier/Dashboard/SupplierDashboard';
```

## 📋 Best Practices

### 1. **Naming Conventions**
- Use PascalCase for component files
- Use camelCase for utility files
- Use kebab-case for CSS files

### 2. **File Organization**
- One component per file
- Related components in the same folder
- Index files for clean exports

### 3. **Import/Export Strategy**
- Use named exports for components
- Use default exports for utilities
- Maintain backward compatibility during migration

### 4. **Component Structure**
```javascript
// Component template
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/useAuthStore';
import { formatCurrency } from '../../utils/helpers';

const ComponentName = ({ prop1, prop2 }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  // Component logic here
  
  return (
    <div>
      {/* JSX here */}
    </div>
  );
};

export default ComponentName;
```

## 🔄 Migration Status

### ✅ Completed
- [x] Common components structure
- [x] Auth components structure
- [x] Supplier Dashboard component
- [x] API service
- [x] Utility functions
- [x] Constants file

### 🚧 In Progress
- [ ] Moving remaining supplier components
- [ ] Moving vendor components
- [ ] Moving order components
- [ ] Moving feedback components

### 📋 To Do
- [ ] Update all import paths
- [ ] Remove legacy component files
- [ ] Update documentation
- [ ] Add TypeScript support
- [ ] Implement feature-based organization

## 🎯 Benefits of New Structure

1. **Scalability**: Easy to add new features
2. **Maintainability**: Related code is grouped together
3. **Reusability**: Common components are easily shared
4. **Clarity**: Clear separation of concerns
5. **Performance**: Better code splitting opportunities
6. **Team Collaboration**: Easier for multiple developers to work on different features

## 📚 Additional Resources

- [React Best Practices](https://react.dev/learn)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Router Documentation](https://reactrouter.com/)
- [React i18next Documentation](https://react.i18next.com/) 