// Database setup script for Salam Journey
// Run with: node setup-db.js

import { createConnection } from 'net';
import { spawn } from 'child_process';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL not set in .env');
  process.exit(1);
}

// SQL to create enums and tables
const setupSQL = `
-- Create enums
CREATE TYPE course_category AS ENUM ('course', 'workshop', 'free');
CREATE TYPE course_status AS ENUM ('active', 'hidden');
CREATE TYPE booking_status AS ENUM ('confirmed', 'pending', 'cancelled');
CREATE TYPE product_type AS ENUM ('pdf', 'printable', 'guide', 'other');
CREATE TYPE product_status AS ENUM ('active', 'hidden');
CREATE TYPE testimonial_status AS ENUM ('active', 'hidden');

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT now()
);

-- Create coaches table
CREATE TABLE coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  bio TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Create courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  title_ar VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  desc_ar TEXT,
  category course_category NOT NULL,
  price DECIMAL(10, 2),
  duration INT,
  status course_status DEFAULT 'active',
  gradient VARCHAR(255),
  created_at TIMESTAMP DEFAULT now()
);

-- Create course_rooms table
CREATE TABLE course_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  room_name VARCHAR(255) NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- Create enrollments table
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  room_id UUID REFERENCES course_rooms(id) ON DELETE SET NULL,
  progress INT DEFAULT 0,
  enrolled_at TIMESTAMP DEFAULT now()
);

-- Create bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  slot VARCHAR(50),
  session_type VARCHAR(100),
  topic VARCHAR(255),
  notes TEXT,
  guest_name VARCHAR(255),
  guest_email VARCHAR(255),
  guest_whatsapp VARCHAR(20),
  status booking_status DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  desc_ar TEXT,
  price DECIMAL(10, 2),
  is_free BOOLEAN DEFAULT false,
  type product_type NOT NULL,
  download_url VARCHAR(500),
  status product_status DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now()
);

-- Create testimonials table
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar VARCHAR(255),
  role_ar VARCHAR(255),
  quote_ar TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  status testimonial_status DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_courses_coach_id ON courses(coach_id);
CREATE INDEX idx_course_rooms_course_id ON course_rooms(course_id);
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_coach_id ON bookings(coach_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_coaches_email ON coaches(email);

-- Verify tables were created
\\dt
`;

console.log('🚀 Setting up Salam Journey database...');
console.log('Database URL:', connectionString.replace(/password[^@]*/, 'password:***'));

// Execute SQL using psql if available, otherwise use Node.js pg driver
const fs = require('fs');
const path = require('path');
const tempFile = path.join(process.cwd(), 'setup-temp.sql');

try {
  fs.writeFileSync(tempFile, setupSQL);

  // Try using psql first
  const psql = spawn('psql', [connectionString, '-f', tempFile], {
    stdio: 'inherit',
    shell: true
  });

  psql.on('close', (code) => {
    fs.unlinkSync(tempFile);
    if (code === 0) {
      console.log('\n✅ Database setup completed successfully!');
    } else {
      console.error('\n❌ Database setup failed');
      process.exit(1);
    }
  });

  psql.on('error', (err) => {
    console.log('psql not available, trying Node.js driver...');
    fs.unlinkSync(tempFile);
    
    // Fallback: use Node.js pg driver if available
    try {
      const pg = require('pg');
      const client = new pg.Client(connectionString);
      
      client.connect()
        .then(() => client.query(setupSQL))
        .then(() => {
          console.log('\n✅ Database setup completed successfully!');
          return client.end();
        })
        .catch(err => {
          console.error('❌ Error:', err.message);
          process.exit(1);
        });
    } catch (e) {
      console.error('❌ Neither psql nor pg driver available. Please install postgres-client or node-postgres.');
      process.exit(1);
    }
  });
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
