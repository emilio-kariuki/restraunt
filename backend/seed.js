// seed.js - Complete database seeding script
const { MongoClient, ObjectId } = require('mongodb');
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
    await db.collection('users').deleteMany({});
    await db.collection('restaurants').deleteMany({});
    await db.collection('menuitems').deleteMany({});
    await db.collection('orders').deleteMany({});
    await db.collection('waitinglists').deleteMany({});
    
    console.log('👤 Creating users...');
    // Create hashed passwords
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    const kitchenPasswordHash = await bcrypt.hash('kitchen123', 12);
    
    // 1. USERS Collection
    const restaurantOwnerId = new ObjectId();
    const kitchenStaffId = new ObjectId();
    const restaurantId = new ObjectId('674a1b2c3d4e5f6789012345');
    
    await db.collection('users').insertMany([
      {
        _id: restaurantOwnerId,
        email: "admin@bellavista.com",
        password: adminPasswordHash,
        role: "admin",
        restaurantId: restaurantId.toString(),
        createdAt: new Date()
      },
      {
        _id: kitchenStaffId,
        email: "kitchen@bellavista.com", 
        password: kitchenPasswordHash,
        role: "staff",
        restaurantId: restaurantId.toString(),
        createdAt: new Date()
      }
    ]);
    
    console.log('🏪 Creating restaurant...');
    // 2. RESTAURANTS Collection
    await db.collection('restaurants').insertOne({
      _id: restaurantId,
      name: "Bella Vista Restaurant",
      address: "123 Main Street, Downtown, City 12345",
      phone: "+1 (555) 123-4567",
      email: "info@bellavista.com",
      tables: [
        {
          tableNumber: "T001",
          capacity: 2,
          status: "available",
          qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
        },
        {
          tableNumber: "T002", 
          capacity: 4,
          status: "available",
          qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
        },
        {
          tableNumber: "T003",
          capacity: 4, 
          status: "occupied",
          qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
        },
        {
          tableNumber: "T004",
          capacity: 6,
          status: "available",
          qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
        },
        {
          tableNumber: "T005",
          capacity: 8,
          status: "reserved", 
          qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
        },
        {
          tableNumber: "T006",
          capacity: 2,
          status: "cleaning",
          qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
        }
      ],
      ownerId: restaurantOwnerId.toString(),
      settings: {
        acceptsReservations: true,
        operatingHours: {
          monday: { open: "11:00", close: "22:00", closed: false },
          tuesday: { open: "11:00", close: "22:00", closed: false },
          wednesday: { open: "11:00", close: "22:00", closed: false },
          thursday: { open: "11:00", close: "23:00", closed: false },
          friday: { open: "11:00", close: "23:00", closed: false },
          saturday: { open: "10:00", close: "23:00", closed: false },
          sunday: { open: "10:00", close: "21:00", closed: false }
        }
      },
      createdAt: new Date()
    });
    
    console.log('🍽️  Creating menu items...');
    // 3. MENU ITEMS Collection
    const menuItems = [
      // APPETIZERS
      {
        restaurantId: restaurantId.toString(),
        name: "Buffalo Wings",
        description: "Crispy chicken wings tossed in our signature buffalo sauce, served with celery sticks and blue cheese dip",
        price: 12.99,
        category: "appetizers",
        available: true,
        allergens: ["dairy", "gluten"],
        createdAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(), 
        name: "Mozzarella Sticks",
        description: "Golden breaded mozzarella cheese sticks served with marinara sauce",
        price: 9.99,
        category: "appetizers",
        available: true,
        allergens: ["dairy", "gluten"],
        createdAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        name: "Loaded Nachos",
        description: "Crispy tortilla chips topped with cheese, jalapeños, sour cream, and guacamole",
        price: 11.99,
        category: "appetizers", 
        available: true,
        allergens: ["dairy"],
        createdAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        name: "Calamari Rings",
        description: "Fresh squid rings lightly battered and fried, served with spicy marinara",
        price: 13.99,
        category: "appetizers",
        available: true,
        allergens: ["seafood", "gluten"],
        createdAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        name: "Spinach Artichoke Dip",
        description: "Creamy blend of spinach and artichokes served hot with tortilla chips",
        price: 10.99,
        category: "appetizers",
        available: true,
        allergens: ["dairy"],
        createdAt: new Date()
      },

      // MAIN COURSES
      {
        restaurantId: restaurantId.toString(),
        name: "Classic Cheeseburger",
        description: "8oz beef patty with cheddar cheese, lettuce, tomato, onion, and pickles on a brioche bun. Served with fries.",
        price: 15.99,
        category: "mains",
        available: true,
        allergens: ["dairy", "gluten"],
        createdAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        name: "Grilled Salmon",
        description: "Fresh Atlantic salmon grilled to perfection, served with roasted vegetables and lemon butter sauce",
        price: 22.99,
        category: "mains",
        available: true,
        allergens: ["seafood", "dairy"],
        createdAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        name: "Chicken Alfredo Pasta",
        description: "Tender grilled chicken breast over fettuccine pasta in a rich creamy alfredo sauce",
        price: 18.99,
        category: "mains",
        available: true,
        allergens: ["dairy", "gluten"],
        createdAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        name: "BBQ Ribs",
        description: "Full rack of slow-cooked baby back ribs with our house BBQ sauce, coleslaw, and cornbread",
        price: 24.99,
        category: "mains",
        available: true,
        allergens: ["gluten"],
        createdAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        name: "Margherita Pizza",
        description: "12\" thin crust pizza with tomato sauce, fresh mozzarella, basil, and olive oil",
        price: 16.99,
        category: "mains",
        available: true,
        allergens: ["dairy", "gluten"],
        createdAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        name: "Ribeye Steak",
        description: "12oz ribeye steak cooked to your liking, served with mashed potatoes and seasonal vegetables",
        price: 32.99,
        category: "mains",
        available: true,
        allergens: ["dairy"],
        createdAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        name: "Fish Tacos",
        description: "Three soft tortillas filled with grilled fish, cabbage slaw, and spicy mayo",
        price: 14.99,
        category: "mains",
        available: true,
        allergens: ["seafood", "gluten"],
        createdAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        name: "Caesar Salad",
        description: "Crisp romaine lettuce with parmesan cheese, croutons, and house-made caesar dressing",
        price: 12.99,
        category: "mains",
        available: true,
        allergens: ["dairy", "gluten"],
        createdAt: new Date()
      },

      // DESSERTS
      {
        restaurantId: restaurantId.toString(),
        name: "Chocolate Lava Cake",
        description: "Warm chocolate cake with a molten center, served with vanilla ice cream",
        price: 8.99,
        category: "desserts",
        available: true,
        allergens: ["dairy", "gluten", "eggs"],
        createdAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        name: "New York Cheesecake",
        description: "Classic creamy cheesecake with graham cracker crust and berry compote",
        price: 7.99,
        category: "desserts",
        available: true,
        allergens: ["dairy", "gluten", "eggs"],
        createdAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        name: "Tiramisu",
        description: "Traditional Italian dessert with coffee-soaked ladyfingers and mascarpone cream",
        price: 9.99,
        category: "desserts",
        available: true,
        allergens: ["dairy", "gluten", "eggs"],
        createdAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        name: "Apple Pie",
        description: "Classic American apple pie with cinnamon and a flaky crust, served warm",
        price: 6.99,
        category: "desserts",
        available: true,
        allergens: ["gluten", "dairy"],
        createdAt: new Date()
      },

      // BEVERAGES
      {
        restaurantId: restaurantId.toString(),
        name: "Coca-Cola",
        description: "Classic refreshing cola served ice cold",
        price: 2.99,
        category: "beverages",
        available: true,
        allergens: [],
        createdAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        name: "Fresh Orange Juice",
        description: "Freshly squeezed orange juice",
        price: 4.99,
        category: "beverages",
        available: true,
        allergens: [],
        createdAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        name: "House Wine (Red)",
        description: "Cabernet Sauvignon from California, full-bodied with notes of dark fruit",
        price: 8.99,
        category: "beverages",
        available: true,
        allergens: ["sulfites"],
        createdAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        name: "House Wine (White)",
        description: "Chardonnay from California, crisp and refreshing with citrus notes",
        price: 8.99,
        category: "beverages",
        available: true,
        allergens: ["sulfites"],
        createdAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        name: "Craft Beer (IPA)",
        description: "Local IPA with citrus and pine hop flavors",
        price: 6.99,
        category: "beverages",
        available: true,
        allergens: ["gluten"],
        createdAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        name: "Iced Coffee",
        description: "Cold brew coffee served over ice with cream on the side",
        price: 3.99,
        category: "beverages",
        available: true,
        allergens: [],
        createdAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        name: "Sparkling Water",
        description: "Premium sparkling water with a splash of lemon",
        price: 2.49,
        category: "beverages",
        available: true,
        allergens: [],
        createdAt: new Date()
      }
    ];
    
    const insertedMenuItems = await db.collection('menuitems').insertMany(menuItems);
    const menuItemIds = Object.values(insertedMenuItems.insertedIds);
    
    console.log('📝 Creating sample orders...');
    // 4. SAMPLE ORDERS
    const sampleOrders = [
      {
        restaurantId: restaurantId.toString(),
        tableId: "T003",
        items: [
          {
            menuItemId: menuItemIds[0].toString(), // Buffalo Wings
            name: "Buffalo Wings", 
            price: 12.99,
            quantity: 1,
            customizations: ["Extra spicy"]
          },
          {
            menuItemId: menuItemIds[5].toString(), // Classic Cheeseburger
            name: "Classic Cheeseburger",
            price: 15.99,
            quantity: 2,
            customizations: ["No pickles", "Medium rare"]
          }
        ],
        subtotal: 44.97,
        tax: 3.60,
        total: 48.57,
        status: "preparing",
        paymentStatus: "paid",
        paymentIntentId: "pi_demo12345",
        customerName: "John Smith",
        customerPhone: "+1234567890",
        specialInstructions: "Table by the window",
        createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        updatedAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(), 
        tableId: "T001",
        items: [
          {
            menuItemId: menuItemIds[6].toString(), // Grilled Salmon
            name: "Grilled Salmon",
            price: 22.99,
            quantity: 1,
            customizations: []
          },
          {
            menuItemId: menuItemIds[19].toString(), // House Wine (Red)
            name: "House Wine (Red)",
            price: 8.99,
            quantity: 1,
            customizations: []
          }
        ],
        subtotal: 31.98,
        tax: 2.56,
        total: 34.54,
        status: "confirmed",
        paymentStatus: "paid",
        paymentIntentId: "pi_demo67890",
        customerName: "Sarah Johnson",
        customerPhone: "+1987654321",
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        updatedAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        tableId: "T002", 
        items: [
          {
            menuItemId: menuItemIds[1].toString(), // Mozzarella Sticks
            name: "Mozzarella Sticks",
            price: 9.99,
            quantity: 1,
            customizations: []
          },
          {
            menuItemId: menuItemIds[10].toString(), // Margherita Pizza
            name: "Margherita Pizza",
            price: 16.99,
            quantity: 1,
            customizations: ["Extra cheese"]
          },
          {
            menuItemId: menuItemIds[17].toString(), // Coca-Cola
            name: "Coca-Cola", 
            price: 2.99,
            quantity: 2,
            customizations: []
          }
        ],
        subtotal: 32.96,
        tax: 2.64,
        total: 35.60,
        status: "ready",
        paymentStatus: "paid",
        paymentIntentId: "pi_demo13579",
        customerName: "Mike Davis",
        customerPhone: "+1122334455",
        specialInstructions: "Extra napkins please",
        createdAt: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
        updatedAt: new Date()
      },
      {
        restaurantId: restaurantId.toString(),
        tableId: "T004", 
        items: [
          {
            menuItemId: menuItemIds[13].toString(), // Caesar Salad
            name: "Caesar Salad",
            price: 12.99,
            quantity: 2,
            customizations: ["Extra croutons"]
          },
          {
            menuItemId: menuItemIds[22].toString(), // Craft Beer
            name: "Craft Beer (IPA)",
            price: 6.99,
            quantity: 2,
            customizations: []
          }
        ],
        subtotal: 39.96,
        tax: 3.20,
        total: 43.16,
        status: "pending",
        paymentStatus: "paid",
        paymentIntentId: "pi_demo24680",
        customerName: "Lisa Anderson",
        customerPhone: "+1999888777",
        createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        updatedAt: new Date()
      }
    ];
    
    await db.collection('orders').insertMany(sampleOrders);
    
    console.log('⏳ Creating waiting list...');
    // 5. WAITING LIST
    await db.collection('waitinglists').insertMany([
      {
        restaurantId: restaurantId.toString(),
        customerName: "Emily Wilson",
        customerPhone: "+1555666777",
        partySize: 4,
        estimatedWaitTime: 15,
        status: "waiting",
        createdAt: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      },
      {
        restaurantId: restaurantId.toString(),
        customerName: "Robert Brown", 
        customerPhone: "+1777888999",
        partySize: 2,
        estimatedWaitTime: 8,
        status: "waiting", 
        createdAt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      }
    ]);
    
    console.log('📊 Creating database indexes...');
    // 6. CREATE INDEXES for better performance
    await db.collection('menuitems').createIndex({ restaurantId: 1, category: 1 });
    await db.collection('orders').createIndex({ restaurantId: 1, status: 1 });
    await db.collection('orders').createIndex({ tableId: 1, createdAt: -1 });
    await db.collection('waitinglists').createIndex({ restaurantId: 1, status: 1, createdAt: 1 });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    
    console.log('\n✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Users: 2 (admin + staff)`);
    console.log(`   • Restaurant: 1 (Bella Vista)`);
    console.log(`   • Tables: 6 (T001-T006)`);
    console.log(`   • Menu Items: ${menuItems.length}`);
    console.log(`   • Sample Orders: ${sampleOrders.length}`);
    console.log(`   • Waiting List: 2 customers`);
    
    console.log('\n🔗 Test URLs:');
    console.log(`   • Frontend Home: http://localhost:3000`);
    console.log(`   • Table T001: http://localhost:3000/table/${restaurantId}/T001`);
    console.log(`   • Table T002: http://localhost:3000/table/${restaurantId}/T002`);
    console.log(`   • Admin Dashboard: http://localhost:3000/admin`);
    
    console.log('\n🔐 Login Credentials:');
    console.log('   • Admin: admin@bellavista.com / admin123');
    console.log('   • Kitchen: kitchen@bellavista.com / kitchen123');
    
    console.log('\n🧪 API Test Commands:');
    console.log(`   curl http://localhost:6000/api/tables/${restaurantId}/T001`);
    console.log(`   curl http://localhost:6000/api/tables/${restaurantId}/T001/menu`);
    console.log(`   curl http://localhost:6000/api/menu/${restaurantId}`);
    
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