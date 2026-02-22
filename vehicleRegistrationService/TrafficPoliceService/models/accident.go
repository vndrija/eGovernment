package models

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

type Accident struct {
	gorm.Model
	Location    string `gorm:"type:nvarchar(255)" json:"location"`
	Description string `gorm:"type:nvarchar(max)" json:"description"`

	// UPDATED: Using Enum
	Severity AccidentSeverity `gorm:"type:nvarchar(20)" json:"severity"`

	AccidentDate   time.Time `json:"accidentDate"`
	InvolvedPlates string    `gorm:"type:nvarchar(500)" json:"involvedPlates"`
	IsResolved     bool      `json:"isResolved"`
}

func (a *Accident) BeforeSave(tx *gorm.DB) (err error) {
	switch a.Severity {
	case SeverityMinor, SeverityMajor, SeverityCritical, SeverityFatal:
		return nil
	case "":
		a.Severity = SeverityMinor // Default
		return nil
	default:
		return errors.New("invalid accident severity")
	}
}
