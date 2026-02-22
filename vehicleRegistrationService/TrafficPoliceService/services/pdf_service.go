package services

import (
	"bytes"
	"fmt"
	"trafficpolice/models"

	"github.com/jung-kurt/gofpdf"
)

// GenerateViolationPDF creates a PDF file in memory
func GenerateViolationPDF(v *models.Violation) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// 1. Header
	pdf.SetFont("Arial", "B", 20)
	pdf.Cell(40, 10, "TRAFFIC VIOLATION TICKET")
	pdf.Ln(12)

	// 2. Ticket ID & Date
	pdf.SetFont("Arial", "", 12)
	pdf.Cell(0, 10, fmt.Sprintf("Ticket ID: #%d", v.ID))
	pdf.Ln(8)
	pdf.Cell(0, 10, fmt.Sprintf("Date: %s", v.ViolationDate.Format("2006-01-02 15:04:05")))
	pdf.Ln(20)

	// 3. Violation Details (Box)
	pdf.SetFillColor(240, 240, 240) // Light gray background
	pdf.Rect(10, 50, 190, 80, "F")

	pdf.SetFont("Arial", "B", 14)
	pdf.Text(15, 60, "Vehicle Information")

	pdf.SetFont("Arial", "", 12)
	pdf.Text(15, 70, fmt.Sprintf("Plate Number:  %s", v.VehiclePlate))
	pdf.Text(15, 80, fmt.Sprintf("Violation Type: %s", v.Type))
	pdf.Text(15, 90, fmt.Sprintf("Location:       %s", v.Location))

	// 4. Fine & Status
	pdf.SetFont("Arial", "B", 14)
	pdf.Text(15, 110, fmt.Sprintf("FINE AMOUNT:   %.2f EUR", v.FineAmount))

	// Color code the status
	if v.Status == models.ViolationPaid {
		pdf.SetTextColor(0, 128, 0) // Green
	} else {
		pdf.SetTextColor(255, 0, 0) // Red
	}
	pdf.Text(15, 120, fmt.Sprintf("STATUS:        %s", v.Status))
	pdf.SetTextColor(0, 0, 0) // Reset to black

	// 5. Footer / Instructions
	pdf.SetY(150)
	pdf.SetFont("Arial", "I", 10)
	pdf.MultiCell(0, 5, "Payment Instructions: Please pay this fine within 8 days via eUprava portal or at the nearest post office. Failure to pay may result in court action.", "", "", false)

	// 6. Output to Buffer
	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}
