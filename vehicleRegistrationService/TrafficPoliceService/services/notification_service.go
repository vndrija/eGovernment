package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type EmailRequest struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

func SendEmail(to, subject, body string) error {
	// cfg := config.LoadConfig()

	// Construct the URL (Assuming NotificationService runs on port 8080 internally)
	// We might need to add NOTIFICATION_SERVICE_URL to config, but for now we hardcode the docker DNS
	url := "http://notificationservice:8080/api/notifications/email"

	payload := EmailRequest{
		To:      to,
		Subject: subject,
		Body:    body,
	}
	jsonPayload, _ := json.Marshal(payload)

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return fmt.Errorf("failed to call notification service: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("notification service returned error: %d", resp.StatusCode)
	}

	return nil
}
