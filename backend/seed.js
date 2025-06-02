const express = require('express');
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const User = require('./src/models/user'); // Adjust the path as necessary
const bcrypt = require('bcryptjs');

// Database configuration
const MONGODB_URI = "mongodb://root:ecoville@84.247.174.84:6004"
const DATABASE_NAME = 'restaurant-qr';

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(DATABASE_NAME);
    
    console.log('🗑️  Clearing existing data...');
    // Clear existing collections

// Create a restaurant ID for the reviews
const superAdmin = {
      email: 'superadmin@restaurant.com',
      password: 'SuperAdmin123!', // Change this password!
      role: 'superadmin',
      name: 'Super Administrator',
      status: 'active'
    }

    await User.create(superAdmin);

    
    console.log('\n🔐 Login Credentials:');
    console.log('   • Admin: admin@bellavista.com / admin123');
    console.log('   • Kitchen: kitchen@bellavista.com / kitchen123');
    
    console.log('\n🧪 API Test Commands:');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase().catch(console.error);
}

module.exports = { seedDatabase };