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

func ReportStolen(c *gin.Context) {
	var input models.StolenVehicle
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.ReportedDate = time.Now()
	input.Status = "ACTIVE"

	if err := database.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to report stolen vehicle"})
		return
	}

	cfg := config.LoadConfig()
	go services.NotifyVehicleService(input.VehiclePlate, "STOLEN", cfg)

	c.JSON(http.StatusCreated, input)
}

func GetStolenVehicles(c *gin.Context) {
	var vehicles []models.StolenVehicle
	database.DB.Find(&vehicles)
	c.JSON(http.StatusOK, vehicles)
}
