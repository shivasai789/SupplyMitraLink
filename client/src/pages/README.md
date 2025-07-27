# Stock Prediction Feature

## Overview
The Stock Prediction feature allows vendors to input 3 days of past sales and stock data to get AI-powered predictions for tomorrow's stock requirements using Google's Gemini API.

## Features

### 🎯 Core Functionality
- **3-Step Form Timeline**: Collect data for Day 1 (3 days ago), Day 2 (2 days ago), Day 3 (yesterday)
- **AI-Powered Predictions**: Uses Gemini API to analyze patterns and provide recommendations
- **LocalStorage Persistence**: Saves predictions and loads them on page refresh
- **Modern UI**: Responsive design with gradient cards and animations

### 📋 Form Fields (Per Day)
- **Date** (required): Date picker for the specific day
- **Customers Served** (required): Number of customers served (≥ 0)
- **Weather Condition** (required): Dropdown with options (Sunny, Rainy, Cloudy, Hot, Cold, Windy, Stormy, Foggy)
- **Items Sold & Leftovers** (required): Dynamic list with:
  - Item Name (required)
  - Quantity Sold (required, ≥ 0)
  - Leftover Quantity (optional, ≥ 0)
- **Popular Items** (optional): Tag-style input for popular items
- **Local Events** (optional): Textarea for events that affected sales

### 🤖 AI Response Structure
The Gemini API returns JSON with:
```json
{
  "suggestedStock": [
    {"item": "item_name", "quantity": number, "reason": "explanation"}
  ],
  "estimatedCustomers": number,
  "productDemandScore": {"item": "score_0_to_10"},
  "tipForToday": "actionable tip for the vendor",
  "rainyDaySpecials": ["special items for rainy weather"]
}
```

### 🎨 UI Components
- **Step Timeline**: Visual progress indicator (1/3, 2/3, 3/3)
- **Form Validation**: Inline error messages with Tailwind styling
- **Loading State**: Animated spinner with typing dots
- **Prediction Results**: Gradient cards with icons and structured data
- **Action Buttons**: "Order Now" (bounce animation) and "New Prediction"

## Technical Implementation

### Files Structure
```
src/
├── pages/
│   └── PredictionPage.jsx          # Main prediction page
├── components/
│   └── DayStepForm.jsx             # Reusable form component
├── utils/
│   └── geminiAPI.js                # Gemini API integration
├── services/
│   └── predictAPI.js               # Prediction service wrapper
└── i18n/locales/
    └── en.json                     # Translation keys
```

### Key Components

#### PredictionPage.jsx
- **State Management**: Manages form data, validation, loading, and prediction state
- **Navigation**: Step-by-step form navigation with validation
- **API Integration**: Calls Gemini API and handles responses
- **LocalStorage**: Auto-save/load prediction data
- **UI Rendering**: Conditional rendering for form vs results

#### DayStepForm.jsx
- **Form Validation**: Real-time validation with error messages
- **Dynamic Fields**: Add/remove items and popular items
- **Input Handling**: Controlled inputs with proper state management
- **Responsive Design**: Grid layout for different screen sizes

#### geminiAPI.js
- **API Communication**: Handles Gemini API requests
- **JSON Parsing**: Cleans and parses API responses (removes markdown wrappers)
- **Error Handling**: Comprehensive error handling for API failures
- **Response Validation**: Validates required fields in AI response

### Validation Logic
- **Required Fields**: Date, Customers Served, Weather Condition
- **Items Validation**: At least one item with valid name and quantity
- **Number Constraints**: All quantities must be ≥ 0
- **Step Progression**: Can only proceed when current step is valid
- **Prediction Button**: Only enabled when all 3 steps are complete and valid

### LocalStorage Integration
- **Auto-save**: Saves prediction to localStorage when generated
- **Auto-load**: Loads saved prediction on page mount
- **Clear Function**: "New Prediction" button clears localStorage
- **Error Handling**: Handles corrupted localStorage data

### Error Handling
- **API Errors**: Network failures, invalid responses
- **JSON Parsing**: Handles malformed JSON from Gemini
- **Validation Errors**: Form validation with user-friendly messages
- **LocalStorage Errors**: Corrupted or invalid saved data

## Usage

### For Vendors
1. Navigate to `/prediction` (protected route for vendors)
2. Fill out 3 days of sales data using the step-by-step form
3. Click "Predict Tomorrow's Stock" to get AI recommendations
4. View results in structured format with actionable insights
5. Click "Order Now" to navigate to dashboard for ordering
6. Use "New Prediction" to start over

### For Developers
1. Set up `VITE_GEMINI_API_KEY` environment variable
2. Ensure all dependencies are installed
3. Test form validation and API integration
4. Verify localStorage functionality
5. Check responsive design on different screen sizes

## Dependencies
- React (hooks: useState, useEffect)
- React Router DOM (useNavigate)
- React i18next (useTranslation)
- Tailwind CSS (styling)
- Gemini API (AI predictions)

## Environment Variables
```env
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

## Future Enhancements
- Export predictions to PDF/Excel
- Historical prediction accuracy tracking
- Weather API integration for automatic weather data
- Machine learning model training on vendor data
- Batch predictions for multiple vendors
- Integration with inventory management system 