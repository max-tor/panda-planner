# 🐼 PlannerPanda

A comprehensive task management and location-aware utility application built with Next.js 15, featuring real-time todo management, interactive maps, and weather integration.

## ✨ Features

### 🎯 Core Todo Management
- **Real-time Todo Updates**: Add, edit, delete, and toggle todos without page refreshes
- **Rich Todo Interface**: Title, description, completion status, and timestamps
- **Persistent Storage**: PostgreSQL database with Prisma ORM
- **User Authentication**: Secure sign-up/sign-in with NextAuth.js

### 🗺️ Interactive Maps & Location Services
- **Gas Stations Map**: Find nearby gas stations with real-time pricing (Google Maps)
- **Air Quality Monitor**: View air quality data within 200km radius with EPA color coding
- **Bike Roads**: Discover cycling infrastructure using OpenStreetMap and real cycling data
- **Smart Geolocation**: Automatic location detection with fallback options

### 🌤️ Weather Integration
- **Live Weather Data**: Current conditions, temperature, humidity, and wind speed
- **Multiple API Sources**: Open-Meteo (primary) and WeatherAPI (fallback)
- **Location-aware**: Automatically detects and displays weather for your location

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark/Light Mode**: Automatic theme switching
- **Real-time Updates**: Instant feedback and state synchronization
- **Loading States**: Smooth loading indicators and error handling

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Google Maps API key (for gas stations and air quality maps)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd next-app
npm install
# or
yarn install
```

2. **Set up environment variables:**
```bash
cp env.template .env.local
```

Edit `.env.local` with your configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/plannerdb"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google Maps (for gas stations & air quality)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Weather APIs (optional - has fallbacks)
WEATHER_API_KEY="your-weather-api-key"
```

3. **Set up the database:**
```bash
npx prisma generate
npx prisma db push
```

4. **Run the development server:**
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see PlannerPanda in action!

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with dark mode support
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Maps**: Google Maps API & OpenStreetMap with Leaflet
- **Weather**: Open-Meteo API & WeatherAPI
- **State Management**: React Context API for real-time updates

### Key Components
- **TodoContext**: Centralized state management for real-time todo operations
- **Map Components**: Modular map implementations for different use cases
- **Weather Widget**: Location-aware weather display with multiple API fallbacks
- **Authentication System**: Secure user management with session handling

## 📱 Pages & Features

### Main Dashboard (`/`)
- Todo management interface
- Weather widget
- Real-time updates without page refresh

### Gas Stations (`/gas-stations`)
- Interactive Google Maps with gas station markers
- Real-time pricing information
- Currency conversion (USD/CAD/EUR based on location)
- Navigation links to Google Maps

### Air Quality (`/air-quality`)
- Air quality monitoring within 200km radius
- EPA standard color coding
- Grayscale map for better contrast
- Health recommendations based on AQI levels

### Bike Roads (`/bike-roads`)
- OpenStreetMap integration
- Real cycling infrastructure data via Overpass API
- 80km radius coverage
- Car-free zones and dedicated cycling paths

### Todos (`/todos`)
- Dedicated todo management page
- Full CRUD operations
- Real-time state synchronization

## 🔧 API Routes

- `/api/todos` - Todo CRUD operations
- `/api/gas-stations` - Gas station data with location queries
- `/api/air-quality` - Air quality data for specified radius
- `/api/cycling-areas` - Real cycling infrastructure via OpenStreetMap
- `/api/weather` - Multi-source weather data with fallbacks
- `/api/auth/*` - NextAuth.js authentication endpoints

## 🌟 Key Features Implemented

✅ **Real-time Todo Updates** - No page refreshes needed
✅ **Multi-source Weather Data** - Reliable weather with fallbacks  
✅ **Interactive Maps** - Google Maps & OpenStreetMap integration
✅ **Location Services** - Smart geolocation with error handling
✅ **Responsive Design** - Mobile-first approach
✅ **Dark Mode Support** - Automatic theme switching
✅ **Type Safety** - Full TypeScript implementation
✅ **Database Integration** - PostgreSQL with Prisma
✅ **Authentication** - Secure user management
✅ **Error Handling** - Comprehensive error states and fallbacks

## 🚀 Deployment

This app is ready for deployment on platforms like Vercel, Netlify, or any Node.js hosting service.

### Environment Setup for Production
1. Set up a PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy with your preferred platform

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and enhancement requests.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
