package handlers

import (
	"net/http"
	"trafficpolice/database"
	"trafficpolice/models"

	"github.com/gin-gonic/gin"
)

// AddFlag puts a flag on a vehicle (e.g., "Stolen", "Warrant").
func AddFlag(c *gin.Context) {
	var input models.VehicleFlag

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ensure the flag is active by default
	input.IsActive = true

	if err := database.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to flag vehicle"})
		return
	}

	c.JSON(http.StatusCreated, input)
}

// GetFlagsByPlate retrieves all *Active* flags for a car.
func GetFlagsByPlate(c *gin.Context) {
	plate := c.Param("plate")

	var flags []models.VehicleFlag

	// Query: Select * FROM flags WHERE plate = ? AND is_active = true
	// We generally don't care about old, resolved flags in a quick lookup.
	database.DB.Where("vehicle_plate = ? AND is_active = ?", plate, true).Find(&flags)

	c.JSON(http.StatusOK, flags)
}

// ResolveFlag marks a flag as inactive (resolved).
func ResolveFlag(c *gin.Context) {
	id := c.Param("id")
	var flag models.VehicleFlag

	if err := database.DB.First(&flag, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Flag not found"})
		return
	}

	// Update specific column
	// We use UpdateColumn instead of Save just to be precise and faster.
	database.DB.Model(&flag).Update("is_active", false)

	c.JSON(http.StatusOK, gin.H{"message": "Flag resolved"})
}
