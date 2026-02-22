package models

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

type StolenVehicle struct {
	gorm.Model
	VehiclePlate string    `gorm:"type:nvarchar(20);uniqueIndex;not null" json:"vehiclePlate"`
	ReportedDate time.Time `json:"reportedDate"`
	Description  string    `gorm:"type:nvarchar(max)" json:"description"`

	// UPDATED: Use the Enum
	Status StolenStatus `gorm:"type:nvarchar(20)" json:"status"`

	ContactInfo string `gorm:"type:nvarchar(255)" json:"contactInfo"`
}

// Validation Hook
func (s *StolenVehicle) BeforeSave(tx *gorm.DB) (err error) {
	switch s.Status {
	case StolenActive, StolenRecovered:
		return nil
	case "":
		s.Status = StolenActive // Default
		return nil
	default:
		return errors.New("invalid stolen status")
	}
}
