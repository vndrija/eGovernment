package config

import (
	"os"
)

type Config struct {
	DBUrl             string
	Port              string
	JwtSecret         string
	JwtIssuer         string
	VehicleServiceUrl string
}

func LoadConfig() *Config {
	return &Config{
		// Default to localhost for local testing, but docker-compose will override these
		DBUrl:             getEnv("DB_URL", "sqlserver://sa:YourStrong@Passw0rd@localhost:1433?database=TrafficPoliceDb"),
		Port:              getEnv("PORT", "8080"),
		JwtSecret:         getEnv("JWT_SECRET", "YourSuperSecretKeyForJWT_MustBe32CharactersOrMore!"), // Matches your docker-compose
		JwtIssuer:         getEnv("JWT_ISSUER", "eUpravaAuthService"),
		VehicleServiceUrl: getEnv("VEHICLE_SERVICE_URL", "http://vehicleservice:8080"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
