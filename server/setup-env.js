const fs = require('fs');
const path = require('path');

const envContent = `# Server Configuration
PORT=8080
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/supplymitralink

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production_environment
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./public/img/uploads
`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📁 Location:', envPath);
  console.log('🔑 JWT_SECRET has been set to a default value');
  console.log('⚠️  Remember to change JWT_SECRET in production!');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
} 