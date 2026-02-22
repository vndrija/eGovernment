package models

import "gorm.io/gorm"

type Officer struct {
	gorm.Model
	BadgeNumber string `gorm:"type:nvarchar(50);uniqueIndex;not null" json:"badgeNumber"`
	FirstName   string `gorm:"type:nvarchar(100)" json:"firstName"`
	LastName    string `gorm:"type:nvarchar(100)" json:"lastName"`
	Rank        string `gorm:"type:nvarchar(50)" json:"rank"`
	StationID   string `gorm:"type:nvarchar(50)" json:"stationId"`
	UserID      string `gorm:"type:nvarchar(450)" json:"userId"`
}
