package models

// --- Accident Severity ---
type AccidentSeverity string

const (
	SeverityMinor    AccidentSeverity = "MINOR"
	SeverityMajor    AccidentSeverity = "MAJOR"
	SeverityCritical AccidentSeverity = "CRITICAL"
	SeverityFatal    AccidentSeverity = "FATAL"
)

// --- Violation Status ---
type ViolationStatus string

const (
	ViolationPending   ViolationStatus = "PENDING"
	ViolationPaid      ViolationStatus = "PAID"
	ViolationDismissed ViolationStatus = "DISMISSED"
)

// --- Violation Type (New! Adds detail) ---
type ViolationType string

const (
	TypeSpeeding ViolationType = "SPEEDING"
	TypeParking  ViolationType = "PARKING"
	TypeDUI      ViolationType = "DUI" // Driving Under Influence
	TypeRedLight ViolationType = "RED_LIGHT"
	TypeDocument ViolationType = "EXPIRED_DOCS"
	TypeReckless ViolationType = "RECKLESS_DRIVING"
)

// --- Stolen Status ---
type StolenStatus string

const (
	StolenActive    StolenStatus = "ACTIVE"
	StolenRecovered StolenStatus = "RECOVERED"
)
