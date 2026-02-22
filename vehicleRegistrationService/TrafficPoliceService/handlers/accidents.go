package handlers

import (
	"net/http"
	"time"
	"trafficpolice/config"
	"trafficpolice/database"
	"trafficpolice/models"
	"trafficpolice/services"

	"github.com/gin-gonic/gin"
)

// ReportAccident logs a crash and notifies the central vehicle registry.
func ReportAccident(c *gin.Context) {
	var input models.Accident

	// 1. Validate Input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 2. Set default time if missing
	if input.AccidentDate.IsZero() {
		input.AccidentDate = time.Now()
	}

	// 3. Save to Local Database (TrafficPoliceDb)
	// We do this FIRST. Even if the external service fails, we must have the record locally.
	if err := database.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log accident in local DB"})
		return
	}

	// 4. Integration: Notify VehicleService
	// We parse the involved plates (stored as CSV "BG-123,NS-456") to notify each one.
	// For simplicity in this university project, we notify regarding the *primary* plate
	// or just pass the raw string if the other service handles it.
	// Here, we assume the frontend sends the "main" culprit's plate in a specific way,
	// or we just pick the first one from the CSV string.

	cfg := config.LoadConfig()

	// We try to notify. If this fails, we return a 201 but with a warning.
	// This ensures the local transaction isn't "undone" just because a remote service is offline.
	err := services.NotifyVehicleService(input.InvolvedPlates, "ACCIDENT", cfg)

	response := gin.H{
		"message": "Accident reported successfully",
		"data":    input,
	}

	if err != nil {
		// Append a warning if integration failed
		response["warning"] = "Saved locally, but failed to notify VehicleService: " + err.Error()
	}

	c.JSON(http.StatusCreated, response)
}

// GetAccidentsByPlate returns accident history for a car.
func GetAccidentsByPlate(c *gin.Context) {
	plate := c.Param("plate")
	var accidents []models.Accident

	// specific SQL LIKE query to find the plate inside the CSV string
	// e.g. "BG-123" matches "BG-123,NS-555"
	database.DB.Where("involved_plates LIKE ?", "%"+plate+"%").Find(&accidents)

	c.JSON(http.StatusOK, accidents)
}
