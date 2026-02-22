package handlers

import (
	"net/http"
	"trafficpolice/database"
	"trafficpolice/models"

	"github.com/gin-gonic/gin"
)

// GetAllOfficers retrieves a list of all police officers.
// distinct from "users" in the auth service, these are specific police profiles.
func GetAllOfficers(c *gin.Context) {
	// 1. Define a slice (array) to hold the results.
	var officers []models.Officer

	// 2. Use GORM to query the DB.
	// We pass the *pointer* (&officers) so GORM can fill it with data.
	result := database.DB.Find(&officers)

	// 3. Check for database errors (connection issues, etc.)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	// 4. Return JSON response with status 200 OK
	c.JSON(http.StatusOK, officers)
}

// CreateOfficer adds a new officer to the database.
func CreateOfficer(c *gin.Context) {
	var input models.Officer

	// 1. Bind JSON body to the struct.
	// ShouldBindJSON reads the request body and maps it to the struct fields.
	// It returns an error if types don't match (e.g., sending a string for an int field).
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 2. Try to create the record.
	// Because we set 'BadgeNumber' as unique in the model, this will fail
	// if the badge number already exists.
	if err := database.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create officer. Badge number might be duplicate."})
		return
	}

	c.JSON(http.StatusCreated, input)
}

// GetOfficerByBadge looks up a single officer.
func GetOfficerByBadge(c *gin.Context) {
	// Get the parameter from the URL (defined later in router as /officers/:badge)
	badge := c.Param("badge")

	var officer models.Officer

	// 'First' adds a "LIMIT 1" to the query and returns an error if not found.
	// We query where badge_number matches our variable.
	if err := database.DB.Where("badge_number = ?", badge).First(&officer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Officer not found"})
		return
	}

	c.JSON(http.StatusOK, officer)
}
