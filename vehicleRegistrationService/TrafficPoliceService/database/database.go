package database

import (
	"log"
	"strings"
	"time"
	"trafficpolice/models"

	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect(connectionString string) {
	var err error
	var db *gorm.DB

	// 1. Create a connection string for 'master' to check/create the DB
	// We replace the target DB name with 'master'
	masterConnString := connectionString
	if strings.Contains(connectionString, "database=TrafficPoliceDb") {
		masterConnString = strings.Replace(connectionString, "database=TrafficPoliceDb", "database=master", 1)
	}

	// 2. Retry Loop: Wait for SQL Server to wake up
	// SQL Server containers take 15-30 seconds to start listening
	maxRetries := 30
	for i := 0; i < maxRetries; i++ {
		// Try connecting to master
		db, err = gorm.Open(sqlserver.Open(masterConnString), &gorm.Config{})
		if err == nil {
			// Check if we can actually ping
			sqlDB, _ := db.DB()
			if pingErr := sqlDB.Ping(); pingErr == nil {
				log.Println("✅ Connected to SQL Server (master).")

				// 3. Create the Database if it doesn't exist
				createDbQuery := `
				IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'TrafficPoliceDb')
				BEGIN
					CREATE DATABASE TrafficPoliceDb;
				END
				`
				if err := db.Exec(createDbQuery).Error; err != nil {
					log.Printf("⚠️ Warning: Failed to ensure DB exists: %v", err)
				} else {
					log.Println("✅ Database 'TrafficPoliceDb' ensured.")
				}

				sqlDB.Close()
				break // Success! Exit the loop
			}
		}

		log.Printf("⏳ SQL Server not ready yet... retrying in 2s (%d/%d)", i+1, maxRetries)
		time.Sleep(2 * time.Second)
	}

	if err != nil {
		log.Fatal("❌ Could not connect to SQL Server after multiple retries. Exiting.")
	}

	// 4. Connect to the actual TrafficPoliceDb
	log.Println("🔌 Connecting to TrafficPoliceDb...")
	DB, err = gorm.Open(sqlserver.Open(connectionString), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Failed to connect to TrafficPoliceDb:", err)
	}

	// 5. Run Migrations
	log.Println("📂 Running Migrations...")
	err = DB.AutoMigrate(
		&models.Officer{},
		&models.Violation{},
		&models.Accident{},
		&models.StolenVehicle{},
		&models.VehicleFlag{},
	)
	if err != nil {
		log.Fatal("❌ Failed to migrate database:", err)
	}
	log.Println("✅ Database migration completed successfully.")
}
