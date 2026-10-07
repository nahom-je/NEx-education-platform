const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const email = 'admin@nexplatform.com';
    const password = 'AdminPassword123!';

    // Check if admin already exists
    let admin = await User.findOne({ email });
    if (admin) {
      console.log('Admin already exists!');
      process.exit();
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Admin User
    admin = new User({
      name: 'NEx Administrator',
      email: email,
      password: hashedPassword,
      role: 'admin',
      bio: 'Platform Manager'
    });

    await admin.save();
    console.log('✅ Default Admin User seeded successfully:');
    console.log(`✉️  Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    
    process.exit();
  } catch (err) {
    console.error('❌ Error seeding admin:', err);
    process.exit(1);
  }
};

seedAdmin();
