export function buildPrompt(data) {
    const { past3Days, todayContext } = data;
  
    let prompt = `You're a helpful assistant for Indian street food vendors.
  
  Based on the past 3 days of sales data and today's context, generate a smart stock purchase and planning prediction.
  
  Use the past sales pattern to:
  - Recommend raw material purchase list (suggested_stock)
  - Forecast product-level demand (product_demand_forecast)
  - Estimate total customers (estimated_customers)
  - Suggest 1 actionable tip (daily_tip)
  - Recommend offers and ingredients needed for them (offers)
  
  ⚠️ VERY IMPORTANT:
  - DO NOT explain anything.
  - DO NOT include markdown, backticks, or headings.
  - ONLY return valid parsable JSON object.
  - NO intro or outro, JUST the JSON.
  
  📊 Past 3 Days of Data:\n`;
  
    past3Days.forEach((day, index) => {
      prompt += `
  Day ${index + 1}:
  - Date: ${day.date}
  - Items Sold: ${Object.entries(day.itemsSold)
        .map(([item, qty]) => `${item}: ${qty}`)
        .join(", ")}
  - Leftovers: ${Object.entries(day.leftovers)
        .map(([item, qty]) => `${item}: ${qty}`)
        .join(", ")}
  - Customers Served: ${day.customersServed}
  - Weather: ${day.weather}
  - Day Type: ${day.dayType}
  `;
    });
  
    prompt += `
  
  📅 Today's Context:
  - Date: ${todayContext.date}
  - Weather: ${todayContext.weather}
  - Day Type: ${todayContext.dayType}
  - Notes: ${todayContext.specialNotes || "None"}
  
  🎯 Return strictly this JSON format (no extra text):
  
  {
    "suggested_stock": [
      { "item": "ItemName", "quantity": "Number + Unit" }
    ],
    "estimated_customers": Number,
    "daily_tip": "One short actionable tip",
    "product_demand_forecast": [
      {
        "product": "DishName",
        "expected_orders": Number,
        "ingredients_required": {
          "ItemName1": "Qty per unit",
          "ItemName2": "Qty per unit"
        }
      }
    ],
    "offers": [
      {
        "name": "OfferName",
        "product": "DishName",
        "estimated_qty_needed": {
          "ItemName1": "Total Qty needed",
          "ItemName2": "Total Qty needed"
        }
      }
    ]
  }
  `;
  
    return prompt;
  }
  