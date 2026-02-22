package handlers

import (
	"net/http"
	"trafficpolice/database"
	"trafficpolice/models"

	"github.com/gin-gonic/gin"
)

// VehicleDossier is a custom struct (DTO) that combines data from multiple tables.
// We don't save this to the DB; we just use it for the JSON response.
type VehicleDossier struct {
	PlateNumber      string                `json:"plateNumber"`
	IsStolen         bool                  `json:"isStolen"`
	StolenDetails    *models.StolenVehicle `json:"stolenDetails,omitempty"` // Pointer allows null if not stolen
	ActiveWarrants   []models.VehicleFlag  `json:"activeWarrants"`
	UnpaidViolations []models.Violation    `json:"unpaidViolations"`
	AccidentCount    int64                 `json:"accidentCount"`
	TotalFinesDue    float64               `json:"totalFinesDue"`
}

// GetVehicleStatus aggregates everything the police know about a specific car.
func GetVehicleStatus(c *gin.Context) {
	plate := c.Param("plate")

	// Initialize the response object
	response := VehicleDossier{
		PlateNumber:      plate,
		ActiveWarrants:   []models.VehicleFlag{},
		UnpaidViolations: []models.Violation{},
	}

	// 1. Check Stolen Status (Most Critical)
	var stolenRecord models.StolenVehicle
	// We look for a record where status is 'ACTIVE'
	err := database.DB.Where("vehicle_plate = ? AND status = ?", plate, "ACTIVE").First(&stolenRecord).Error
	if err == nil {
		response.IsStolen = true
		response.StolenDetails = &stolenRecord
	} else {
		response.IsStolen = false
	}

	// 2. Get Active Flags (Warrants, Expired Reg, etc.)
	database.DB.Where("vehicle_plate = ? AND is_active = ?", plate, true).Find(&response.ActiveWarrants)

	// 3. Get Unpaid Violations
	database.DB.Where("vehicle_plate = ? AND status = ?", plate, "PENDING").Find(&response.UnpaidViolations)

	// 4. Calculate Total Fines (Business Logic)
	for _, v := range response.UnpaidViolations {
		response.TotalFinesDue += v.FineAmount
	}

	// 5. Count Accidents (History check)
	database.DB.Model(&models.Accident{}).Where("involved_plates LIKE ?", "%"+plate+"%").Count(&response.AccidentCount)

	// Return the full dossier
	c.JSON(http.StatusOK, response)
}
