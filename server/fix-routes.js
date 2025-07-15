// Temporary script to fix routes with correct userId parameter

const fs = require('fs');
const path = require('path');

// Read the routes file
const routesPath = './server/routes.ts';
let content = fs.readFileSync(routesPath, 'utf8');

// Pattern replacements to fix multi-user routes
const fixes = [
  // Fix getUserId calls
  { search: /getUserId\(req\)/g, replace: 'getUserId(req)' },
  
  // Fix storage method calls that need userId as first parameter
  { search: /storage\.getUser\(\)/g, replace: 'storage.getUser(userId)' },
  { search: /storage\.getUserStats\(\)/g, replace: 'storage.getUserStats(userId)' },
  { search: /storage\.updateUserStats\(([^)]+)\)/g, replace: 'storage.updateUserStats(userId, $1)' },
  { search: /storage\.getAchievements\(\)/g, replace: 'storage.getAchievements(userId)' },
  { search: /storage\.unlockAchievement\(([^)]+)\)/g, replace: 'storage.unlockAchievement(userId, $1)' },
  { search: /storage\.getDailyProgress\(([^)]+)\)/g, replace: 'storage.getDailyProgress(userId, $1)' },
  { search: /storage\.updateDailyProgress\(([^,]+),\s*([^)]+)\)/g, replace: 'storage.updateDailyProgress(userId, $1, $2)' },
  { search: /storage\.getDailyProgressHistory\(([^)]+)\)/g, replace: 'storage.getDailyProgressHistory(userId, $1)' },
  { search: /storage\.getTradeSuggestions\(\)/g, replace: 'storage.getTradeSuggestions(userId)' },
  { search: /storage\.getActiveTradeSuggestions\(\)/g, replace: 'storage.getActiveTradeSuggestions(userId)' },
  { search: /storage\.createTradeSuggestion\(([^)]+)\)/g, replace: 'storage.createTradeSuggestion(userId, $1)' },
  { search: /storage\.updateTradeSuggestionStatus\(([^,]+),\s*([^)]+)\)/g, replace: 'storage.updateTradeSuggestionStatus(userId, $1, $2)' },
  { search: /storage\.deleteTradeSuggestion\(([^)]+)\)/g, replace: 'storage.deleteTradeSuggestion(userId, $1)' },
  { search: /storage\.getTradeById\(([^)]+)\)/g, replace: 'storage.getTradeById(userId, $1)' },
  { search: /storage\.deleteTrade\(([^)]+)\)/g, replace: 'storage.deleteTrade(userId, $1)' },
  { search: /storage\.getTradesByDateRange\(([^,]+),\s*([^,]+),?\s*([^)]*)\)/g, replace: 'storage.getTradesByDateRange(userId, $1, $2, $3)' },
  { search: /storage\.getTradesBySymbol\(([^,]+),?\s*([^)]*)\)/g, replace: 'storage.getTradesBySymbol(userId, $1, $2)' },
  { search: /storage\.getAccountById\(([^)]+)\)/g, replace: 'storage.getAccountById(userId, $1)' }
];

// Apply fixes
fixes.forEach(fix => {
  content = content.replace(fix.search, fix.replace);
});

// Write back the file
fs.writeFileSync(routesPath, content, 'utf8');
console.log('Routes fixed successfully!');