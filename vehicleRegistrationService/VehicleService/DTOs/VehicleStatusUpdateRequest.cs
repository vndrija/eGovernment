namespace VehicleService.DTOs;

// Received from TrafficPoliceService (Go) when a vehicle is reported stolen or involved in an accident
public class VehicleStatusUpdateRequest
{
    public string VehiclePlate { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // "STOLEN" | "ACCIDENT" | "CLEAR"
}
