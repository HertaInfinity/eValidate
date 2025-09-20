/*
  # Initial Schema for Legal Metrology Compliance Checker

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text, product name)
      - `manufacturer` (text, manufacturer name)
      - `description` (text, product description)
      - `image_url` (text, product image URL)
      - `mrp` (decimal, maximum retail price)
      - `net_quantity` (text, net quantity with units)
      - `country_of_origin` (text, country of origin)
      - `date_of_manufacture` (date, manufacturing date)
      - `consumer_care_details` (text, consumer care information)
      - `platform` (text, e-commerce platform name)
      - `platform_product_id` (text, product ID on the platform)
      - `compliance_status` (text, compliance check status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `reports`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `reporter_id` (uuid, foreign key to auth.users)
      - `license_number` (text, license number)
      - `violation_details` (text, violation description)
      - `violation_type` (text, type of violation)
      - `severity` (text, severity level)
      - `status` (text, report status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `rules`
      - `id` (uuid, primary key)
      - `rule_name` (text, name of the rule)
      - `field_to_validate` (text, field being validated)
      - `rule_type` (text, type of validation rule)
      - `rule_value` (jsonb, rule configuration)
      - `description` (text, rule description)
      - `is_active` (boolean, whether rule is active)
      - `created_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
    - Add policies for reports and rules management
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  manufacturer text,
  description text,
  image_url text,
  mrp decimal(10,2),
  net_quantity text,
  country_of_origin text,
  date_of_manufacture date,
  consumer_care_details text,
  platform text,
  platform_product_id text,
  compliance_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  license_number text,
  violation_details text NOT NULL,
  violation_type text,
  severity text DEFAULT 'medium',
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create rules table
CREATE TABLE IF NOT EXISTS rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  field_to_validate text NOT NULL,
  rule_type text NOT NULL,
  rule_value jsonb NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Anyone can view products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true);

-- Reports policies
CREATE POLICY "Users can view all reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can update their own reports"
  ON reports
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Rules policies
CREATE POLICY "Users can view all rules"
  ON rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create rules"
  ON rules
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update rules they created"
  ON rules
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete rules they created"
  ON rules
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Insert some sample rules for Legal Metrology compliance
INSERT INTO rules (rule_name, field_to_validate, rule_type, rule_value, description, created_by) VALUES
('MRP Presence Check', 'mrp', 'presence', '{"required": true}', 'Ensures MRP is present on product listing', null),
('Country of Origin Check', 'country_of_origin', 'presence', '{"required": true}', 'Ensures country of origin is specified', null),
('Net Quantity Format', 'net_quantity', 'regex', '{"pattern": "^\\d+(\\.\\d+)?\\s*(kg|g|l|ml|pcs|units?)$", "flags": "i"}', 'Validates net quantity format with proper units', null),
('Manufacturer Details', 'manufacturer', 'presence', '{"required": true}', 'Ensures manufacturer information is provided', null),
('Consumer Care Presence', 'consumer_care_details', 'presence', '{"required": true}', 'Ensures consumer care details are provided', null);

-- Insert some sample products for testing
INSERT INTO products (name, manufacturer, description, image_url, mrp, net_quantity, country_of_origin, platform, platform_product_id, compliance_status) VALUES
('Organic Basmati Rice', 'ABC Foods Pvt Ltd', 'Premium quality organic basmati rice', 'https://images.pexels.com/photos/33239/rice-grain-seed-food.jpg', 299.99, '1 kg', 'India', 'Amazon', 'AMZ123456', 'compliant'),
('Instant Coffee Powder', 'XYZ Beverages', 'Rich and aromatic instant coffee', 'https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg', 149.50, '100 g', 'India', 'Flipkart', 'FLK789012', 'non-compliant'),
('Whole Wheat Flour', 'PQR Mills', 'Fresh whole wheat flour', 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg', 89.00, '5 kg', 'India', 'Amazon', 'AMZ345678', 'pending'),
('Green Tea Bags', 'DEF Tea Company', 'Premium green tea bags', 'https://images.pexels.com/photos/1417945/pexels-photo-1417945.jpeg', 199.99, '25 bags', 'India', 'Flipkart', 'FLK456789', 'compliant');