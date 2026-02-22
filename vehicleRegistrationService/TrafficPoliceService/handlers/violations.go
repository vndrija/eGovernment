package handlers

import (
	"fmt"
	"net/http"
	"time"
	"trafficpolice/database"
	"trafficpolice/models"
	"trafficpolice/services"

	"github.com/gin-gonic/gin"
)

// IssueViolation creates a new traffic ticket.
func IssueViolation(c *gin.Context) {
	var input models.Violation

	// 1. Bind input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 2. Set defaults if not provided by the frontend.
	// In Go, time.Time zero value is messy, so usually better to set Now() explicitly.
	if input.ViolationDate.IsZero() {
		input.ViolationDate = time.Now()
	}
	// Default status is usually PENDING payment
	if input.Status == "" {
		input.Status = "PENDING"
	}

	// 3. Save to DB
	if err := database.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to issue violation"})
		return
	}

	c.JSON(http.StatusCreated, input)
}

// GetViolationsByPlate returns all tickets for a specific car.
// Useful for the "Vehicle Status" check.
func GetViolationsByPlate(c *gin.Context) {
	plate := c.Param("plate") // e.g., /violations/BG-123-XX

	var violations []models.Violation

	// Find all records matching the plate.
	// Unlike 'First', 'Find' does NOT return an error if the list is empty;
	// it just returns an empty slice, which is correct (0 violations is valid).
	result := database.DB.Where("vehicle_plate = ?", plate).Find(&violations)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, violations)
}

// PayViolation updates status AND sends email
func PayViolation(c *gin.Context) {
	id := c.Param("id")
	var violation models.Violation

	if err := database.DB.First(&violation, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Violation not found"})
		return
	}

	// Update Status
	violation.Status = models.ViolationPaid
	database.DB.Save(&violation)

	// --- NEW: Send Email Notification ---
	if violation.OffenderEmail != "" {
		subject := fmt.Sprintf("Payment Confirmation - Ticket #%d", violation.ID)
		body := fmt.Sprintf("Dear Driver,\n\nWe confirm that Violation #%d for plate %s has been successfully PAID.\n\nThank you,\nTraffic Police", violation.ID, violation.VehiclePlate)

		// Send async so we don't block the UI
		go func() {
			err := services.SendEmail(violation.OffenderEmail, subject, body)
			if err != nil {
				fmt.Printf("Failed to send email: %v\n", err)
			}
		}()
	}
	// ------------------------------------

	c.JSON(http.StatusOK, gin.H{"message": "Violation paid successfully", "data": violation})
}

// DownloadViolationPDF generates and serves the PDF
func DownloadViolationPDF(c *gin.Context) {
	id := c.Param("id")
	var violation models.Violation

	// 1. Find Data
	if err := database.DB.First(&violation, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Violation not found"})
		return
	}

	// 2. Generate PDF
	pdfBytes, err := services.GenerateViolationPDF(&violation)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate PDF"})
		return
	}

	// 3. Serve File
	// These headers tell the browser "This is a file, download it"
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=violation_%d.pdf", violation.ID))
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Length", fmt.Sprintf("%d", len(pdfBytes)))

	c.Data(http.StatusOK, "application/pdf", pdfBytes)
}
