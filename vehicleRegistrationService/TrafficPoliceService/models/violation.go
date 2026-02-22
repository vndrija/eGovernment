package models

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

type Violation struct {
	gorm.Model
	VehiclePlate string `gorm:"type:nvarchar(20);index;not null" json:"vehiclePlate"`
	OfficerID    uint   `json:"officerId"`

	Type ViolationType `gorm:"type:nvarchar(50)" json:"type"`

	Description string  `gorm:"type:nvarchar(max)" json:"description"`
	Location    string  `gorm:"type:nvarchar(255)" json:"location"`
	FineAmount  float64 `json:"fineAmount"`

	Status ViolationStatus `gorm:"type:nvarchar(20)" json:"status"`

	ViolationDate time.Time `json:"violationDate"`
	OffenderEmail string    `gorm:"type:nvarchar(100)" json:"offenderEmail"`
}

// BeforeSave is a GORM Hook. It runs automatically before inserting/updating.
func (v *Violation) BeforeSave(tx *gorm.DB) (err error) {
	// 1. Validate Status
	switch v.Status {
	case ViolationPending, ViolationPaid, ViolationDismissed:
		// valid
	default:
		return errors.New("invalid violation status")
	}

	// 2. Validate Type (Optional, but good for data quality)
	switch v.Type {
	case TypeSpeeding, TypeParking, TypeDUI, TypeRedLight, TypeDocument, TypeReckless:
		// valid
	default:
		// If it's empty, default to Reckless or generic, or return error
		if v.Type == "" {
			v.Type = TypeReckless // Default fallback
		} else {
			return errors.New("invalid violation type")
		}
	}

	return nil
}
