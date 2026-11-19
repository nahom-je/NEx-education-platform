const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const supabase = require('./lib/supabase');

dotenv.config();

const seedAdmin = async () => {
  try {
    const email = 'admin@nexplatform.com';
    const password = 'AdminPassword123!';

    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingAdmin) {
      console.log('Admin already exists in Supabase!');
      process.exit();
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert Admin User into Supabase
    const { data: admin, error: insertError } = await supabase
      .from('users')
      .insert({
        name: 'NEx Administrator',
        email: email,
        password: hashedPassword,
        role: 'admin',
        bio: 'Platform Manager'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log('✅ Default Admin User seeded successfully in Supabase:');
    console.log(`✉️  Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🆔 ID: ${admin.id}`);
    
    process.exit();
  } catch (err) {
    console.error('❌ Error seeding admin:', err.message);
    process.exit(1);
  }
};

seedAdmin();
