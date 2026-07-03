-- ============================================================
-- FARMITI DATABASE SCHEMA v2 — MySQL
-- Run: mysql -u root -p -e "CREATE DATABASE farmiti_db CHARACTER SET utf8mb4;"
--      mysql -u root -p farmiti_db < db/schema.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS weather_alerts;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS scheme_enrollments;
DROP TABLE IF EXISTS schemes;
DROP TABLE IF EXISTS price_history;
DROP TABLE IF EXISTS market_prices;
DROP TABLE IF EXISTS disease_detections;
DROP TABLE IF EXISTS crop_recommendation_history;
DROP TABLE IF EXISTS farmer_crops;
DROP TABLE IF EXISTS farm_details;
DROP TABLE IF EXISTS farmers;

DROP TABLE IF EXISTS calendar_events;

SET FOREIGN_KEY_CHECKS = 1;

-- Farmers (user accounts)
CREATE TABLE farmers (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  phone         VARCHAR(20)  UNIQUE NOT NULL,
  email         VARCHAR(150),
  password_hash VARCHAR(255) NOT NULL,
  avatar_url    TEXT,
  state         VARCHAR(60)  DEFAULT 'Tamil Nadu',
  district      VARCHAR(60),
  village       VARCHAR(60),
  pincode       VARCHAR(10),
  gender        VARCHAR(20),
  dob           DATE,
  language_pref VARCHAR(10)  DEFAULT 'en',
  weather_sms   BOOLEAN      DEFAULT FALSE,
  is_active     BOOLEAN      DEFAULT TRUE,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4;

-- Farm details
CREATE TABLE farm_details (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id    INT UNIQUE,
  land_size    DECIMAL(10,2),
  land_type    VARCHAR(50),
  soil_type    VARCHAR(50),
  water_source VARCHAR(100),
  primary_crop VARCHAR(100),
  bank_name    VARCHAR(100),
  account_no   VARCHAR(30),
  ifsc         VARCHAR(20),
  aadhaar      VARCHAR(20),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;

-- Farmer crops
CREATE TABLE farmer_crops (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id        INT,
  crop_name        VARCHAR(100) NOT NULL,
  acres            DECIMAL(10,2),
  season           VARCHAR(50),
  status           VARCHAR(50)  DEFAULT 'Growing',
  planted_at       DATE,
  expected_harvest DATE,
  notes            TEXT,
  img_url          TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;

-- Crop recommendation history
CREATE TABLE crop_recommendation_history (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id       INT,
  soil_type       VARCHAR(50),
  area            DECIMAL(10,2),
  rainfall        DECIMAL(10,2),
  ph              DECIMAL(4,2),
  season          VARCHAR(50),
  irrigation      VARCHAR(50),
  recommendations JSON,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;

-- Disease detections
CREATE TABLE disease_detections (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id        INT,
  image_url        TEXT,
  crop_name        VARCHAR(100),
  disease_name     VARCHAR(200),
  confidence       DECIMAL(5,2),
  severity         VARCHAR(20),
  analysis_result  JSON,
  treatment_status VARCHAR(50) DEFAULT 'Pending',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;

-- Market prices
CREATE TABLE market_prices (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  crop_name  VARCHAR(100) NOT NULL,
  category   VARCHAR(50),
  price      DECIMAL(10,2),
  prev_price DECIMAL(10,2),
  unit       VARCHAR(30)  DEFAULT '₹/Qtl',
  market     VARCHAR(100),
  state      VARCHAR(60),
  img_url    TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4;

-- Price history
CREATE TABLE price_history (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  crop_id     INT,
  price       DECIMAL(10,2),
  recorded_at DATE,
  FOREIGN KEY (crop_id) REFERENCES market_prices(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;

-- Government schemes
CREATE TABLE schemes (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  full_name    VARCHAR(300),
  category     VARCHAR(50),
  amount       VARCHAR(100),
  ministry     VARCHAR(200),
  deadline     VARCHAR(50),
  description  TEXT,
  requirements JSON,
  benefits     TEXT,
  website_url  VARCHAR(300),
  img_url      TEXT,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4;

-- Scheme enrollments
CREATE TABLE scheme_enrollments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id   INT,
  scheme_id   INT,
  status      VARCHAR(50) DEFAULT 'applied',
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes       TEXT,
  UNIQUE KEY unique_enrollment (farmer_id, scheme_id),
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
  FOREIGN KEY (scheme_id) REFERENCES schemes(id)
) CHARACTER SET utf8mb4;

-- Chat messages
CREATE TABLE chat_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id  INT,
  role       ENUM('user','assistant') NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;

-- Weather alerts
CREATE TABLE weather_alerts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id   INT,
  type        VARCHAR(50),
  title       VARCHAR(200),
  description TEXT,
  severity    VARCHAR(20),
  area        VARCHAR(100),
  actions     JSON,
  is_read     BOOLEAN   DEFAULT FALSE,
  expires_at  TIMESTAMP NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;

-- Calendar events
CREATE TABLE calendar_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  description TEXT,
  type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'upcoming',
  reminder_mins INT DEFAULT 10,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;

-- Notifications (for all types)
CREATE TABLE notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id  INT,
  type       VARCHAR(50) NOT NULL,
  title      VARCHAR(200) NOT NULL,
  message    TEXT,
  link       VARCHAR(255),
  data       JSON,
  is_read    BOOLEAN   DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;

-- Indexes
CREATE INDEX idx_farmers_phone           ON farmers(phone);
CREATE INDEX idx_farmer_crops_farmer     ON farmer_crops(farmer_id);
CREATE INDEX idx_disease_farmer          ON disease_detections(farmer_id);
CREATE INDEX idx_rec_history_farmer      ON crop_recommendation_history(farmer_id);
CREATE INDEX idx_chat_farmer             ON chat_messages(farmer_id);
CREATE INDEX idx_scheme_enroll_farmer    ON scheme_enrollments(farmer_id);
CREATE INDEX idx_weather_alerts_farmer   ON weather_alerts(farmer_id);
CREATE INDEX idx_notifications_farmer    ON notifications(farmer_id);
CREATE INDEX idx_notifications_read      ON notifications(farmer_id, is_read);
CREATE INDEX idx_market_crop_name        ON market_prices(crop_name);
CREATE INDEX idx_market_category         ON market_prices(category);

SELECT 'Farmiti v2 MySQL schema created successfully!' AS result;
