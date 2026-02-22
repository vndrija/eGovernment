package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"trafficpolice/config"
)

// 1. Define the structure matching the C# JSON Response
// C# returns: { "message": "...", "data": { ... } }
type VehicleServiceResponse struct {
	Message string      `json:"message"`
	Data    VehicleData `json:"data"`
}

type VehicleData struct {
	ID                 int    `json:"id"`
	RegistrationNumber string `json:"registrationNumber"`
	Make               string `json:"make"`
	Model              string `json:"model"`
	OwnerName          string `json:"ownerName"`
	OwnerJMBG          string `json:"ownerJmbg"`
	Color              string `json:"color"`
	Year               int    `json:"year"`
}

// NotifyVehicleService (Existing function - keep it)
func NotifyVehicleService(plate string, status string, cfg *config.Config) error {
	payload := map[string]string{
		"vehiclePlate": plate,
		"status":       status,
	}
	jsonPayload, _ := json.Marshal(payload)
	url := fmt.Sprintf("%s/api/vehicles/update-status", cfg.VehicleServiceUrl)

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return fmt.Errorf("vehicle service returned status: %d", resp.StatusCode)
	}
	return nil
}

// Update the function signature to accept 'token'
func GetVehicleDetails(plate string, token string, cfg *config.Config) (*VehicleData, error) {
	url := fmt.Sprintf("%s/api/vehicles/plate/%s", cfg.VehicleServiceUrl, plate)

	// Create a new HTTP Request object (instead of using http.Get)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Add the Authorization Header
	req.Header.Set("Authorization", "Bearer "+token)

	// Send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call vehicle service: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, nil
	}

	// Handle 401 specifically to give a clear error
	if resp.StatusCode == http.StatusUnauthorized {
		return nil, fmt.Errorf("vehicle service rejected token (401)")
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("vehicle service returned non-200 status: %d", resp.StatusCode)
	}

	var result VehicleServiceResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	return &result.Data, nil
}
