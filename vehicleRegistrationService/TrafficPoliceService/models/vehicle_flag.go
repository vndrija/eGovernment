package models

import "gorm.io/gorm"

type VehicleFlag struct {
	gorm.Model
	// Index added for fast lookups by plate
	VehiclePlate string `gorm:"type:nvarchar(20);index;not null" json:"vehiclePlate"`
	FlagType     string `gorm:"type:nvarchar(50)" json:"flagType"`
	Description  string `gorm:"type:nvarchar(255)" json:"description"`
	IsActive     bool   `json:"isActive"`
}
