#!/bin/bash
set -e

echo "daydesk Setup Script"
echo "======================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+ first."
    exit 1
fi

echo "✓ Node.js $(node --version) found"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found."
    exit 1
fi

echo "✓ npm $(npm --version) found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file and add your Auth0 credentials!"
    echo ""
    echo "To get Auth0 credentials:"
    echo "1. Go to https://auth0.com (free account)"
    echo "2. Create a 'Regular Web Application'"
    echo "3. Add callback URL: http://localhost:3000/api/auth/callback/auth0"
    echo "4. Copy Client ID, Client Secret, and Domain to .env"
    echo ""
    echo "Generate NEXTAUTH_SECRET with: openssl rand -base64 32"
    echo ""
    read -p "Press Enter when you've updated .env file..."
fi

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate
echo "✓ Prisma client generated"
echo ""

# Push database schema
echo "🗄️  Creating database..."
npx prisma db push
echo "✓ Database created"
echo ""

echo "✅ Setup complete!"
echo ""
echo "To start development server:"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "📖 See SETUP.md for more details"
