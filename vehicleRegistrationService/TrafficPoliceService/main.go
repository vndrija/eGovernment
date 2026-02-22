package main

import (
	"log"
	"trafficpolice/config"
	"trafficpolice/database"
	"trafficpolice/handlers"
	"trafficpolice/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// -------------------------------------------------------------------------
	// 1. Initialization Phase
	// -------------------------------------------------------------------------

	// Load environment variables (DB string, JWT secret, etc.)
	// We do this first because everything else depends on these values.
	cfg := config.LoadConfig()

	// Connect to SQL Server
	// This function includes the retry logic we added earlier.
	// The app will pause here until the database is ready.
	database.Connect(cfg.DBUrl)

	// Initialize the Gin router
	// gin.Default() returns a router with default middleware (Logger and Recovery).
	// Logger: logs every request to console.
	// Recovery: recovers from any panics (crashes) so the server stays up.
	r := gin.Default()

	// -------------------------------------------------------------------------
	// 2. CORS Configuration (Crucial for Frontend Integration)
	// -------------------------------------------------------------------------

	// Browsers block requests from one domain (localhost:4200 Angular)
	// to another (localhost:5003 Go) unless CORS headers are present.
	corsConfig := cors.Config{
		// Allow the Angular frontend URL explicitly
		AllowOrigins: []string{"http://localhost:4200"},
		// Allow standard HTTP methods
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		// Allow headers usually sent by Angular (Content-Type) and Auth (Authorization)
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
		// Expose headers if needed (rarely used here but good practice)
		ExposeHeaders: []string{"Content-Length"},
		// Allow cookies or auth tokens to be passed
		AllowCredentials: true,
	}
	r.Use(cors.New(corsConfig))

	// -------------------------------------------------------------------------
	// 3. Route Definition
	// -------------------------------------------------------------------------

	// We group all routes under /api/police.
	// This keeps the API versioned and clean.
	api := r.Group("/api/police")

	// Apply Authentication Middleware
	// This protects ALL routes in this group.
	// Requests without a valid JWT token in the header will be rejected here.
	api.Use(middleware.AuthMiddleware(cfg))
	{
		// --- Officer Management ---
		// GET /api/police/officers -> List all
		api.GET("/officers", handlers.GetAllOfficers)
		// POST /api/police/officers -> Create new (usually an Admin function)
		api.POST("/officers", handlers.CreateOfficer)
		// GET /api/police/officers/:badge -> Find specific officer
		api.GET("/officers/:badge", handlers.GetOfficerByBadge)

		// --- Traffic Violations ---
		api.POST("/violations", handlers.IssueViolation)
		api.GET("/violations/plate/:plate", handlers.GetViolationsByPlate)
		api.PUT("/violations/:id/pay", handlers.PayViolation)
		api.GET("/violations/:id/pdf", handlers.DownloadViolationPDF)

		// --- Accidents ---
		// POST /api/police/accidents -> Report crash & notify VehicleService
		api.POST("/accidents", handlers.ReportAccident)
		// GET /api/police/accidents/plate/:plate -> Get crash history
		api.GET("/accidents/plate/:plate", handlers.GetAccidentsByPlate)

		// --- Stolen Vehicles ---
		// POST /api/police/stolen -> Report stolen
		api.POST("/stolen", handlers.ReportStolen)
		// GET /api/police/stolen -> List all active stolen cars
		api.GET("/stolen", handlers.GetStolenVehicles)

		// --- Vehicle Flags (Warrants/Alerts) ---
		// POST /api/police/flags -> Add a flag (e.g. "Suspect in robbery")
		api.POST("/flags", handlers.AddFlag)
		// GET /api/police/flags/:plate -> Get active flags
		api.GET("/flags/:plate", handlers.GetFlagsByPlate)
		// PUT /api/police/flags/:id/resolve -> Clear a flag
		api.PUT("/flags/:id/resolve", handlers.ResolveFlag)

		// --- The Aggregator (Main Dashboard Endpoint) ---
		// GET /api/police/status/:plate -> Returns EVERYTHING about a car
		// This is what the frontend uses to show the "Police File"
		api.GET("/status/:plate", handlers.GetVehicleStatus)

		// --- External Integrations (Proxy) ---
		// Angular calls THIS -> Go calls C# -> Go returns result
		api.GET("/lookup/:plate", handlers.ProxyVehicleDetails)

	}

	// -------------------------------------------------------------------------
	// 4. Server Start
	// -------------------------------------------------------------------------

	log.Printf("👮 Traffic Police Service starting on port %s...", cfg.Port)

	// Start listening.
	// If this fails (e.g., port in use), the app will crash with a log.
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
