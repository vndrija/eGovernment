using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VehicleService.DTOs;
using VehicleService.Enums;
using VehicleService.Models;

namespace VehicleService.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class RegistrationRequestsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _environment;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<RegistrationRequestsController> _logger;

    public RegistrationRequestsController(AppDbContext db, IWebHostEnvironment environment, IHttpClientFactory httpClientFactory, ILogger<RegistrationRequestsController> logger)
    {
        _db = db;
        _environment = environment;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    // POST: api/RegistrationRequests
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreateRegistrationRequestDto dto)
    {
        if (!User?.Identity?.IsAuthenticated ?? true)
        {
            return Unauthorized(new { message = "Authentication required" });
        }

        var userId = User.FindFirst("sub")?.Value
                     ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("id")?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "User ID not found in token" });
        }

        // Validation: Check vehicle exists
        var vehicle = await _db.Vehicles.FindAsync(dto.VehicleId);
        if (vehicle == null)
        {
            return NotFound(new { message = "Vehicle not found" });
        }

        // Validation: User must own the vehicle
        if (vehicle.OwnerId != userId)
        {
            return Forbid();
        }

        // Type-specific validation
        if (dto.Type == RegistrationRequestType.New)
        {
            // Validation: Vehicle cannot be registered twice (for new registration)
            if (vehicle.Status == VehicleStatus.Registered || vehicle.Status == VehicleStatus.Active)
            {
                return BadRequest(new { message = "Vehicle is already registered. Use renewal for registered vehicles." });
            }

            // Validation: All three documents must be uploaded for new registration
            if (dto.InsuranceDoc == null || dto.InspectionDoc == null || dto.IdentityDoc == null)
            {
                return BadRequest(new { message = "All three documents (Insurance, Inspection, Identity) must be uploaded for new registration" });
            }
        }
        else if (dto.Type == RegistrationRequestType.Renewal)
        {
            // Validation: Vehicle must be Registered
            if (vehicle.Status != VehicleStatus.Registered)
            {
                return BadRequest(new { message = "Only registered vehicles can be renewed" });
            }

            // Validation: Vehicle must expire within 30 days or already expired
            var daysUntilExpiration = (vehicle.ExpirationDate - DateTime.Now).TotalDays;
            var isExpired = vehicle.ExpirationDate < DateTime.Now;
            var expiresWithin30Days = daysUntilExpiration <= 30 && daysUntilExpiration >= 0;

            if (!isExpired && !expiresWithin30Days)
            {
                return BadRequest(new { message = "Vehicle can only be renewed if it expires within 30 days or is already expired" });
            }

            // Validation: Insurance and Inspection documents required for renewal
            if (dto.InsuranceDoc == null || dto.InspectionDoc == null)
            {
                return BadRequest(new { message = "Insurance and Inspection documents must be uploaded for renewal" });
            }
        }

        // CHECK: Verify vehicle has no outstanding fines with police before submitting registration request
        try
        {
            var policeClient = _httpClientFactory.CreateClient("TrafficPoliceService");
            var token = Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(token))
            {
                policeClient.DefaultRequestHeaders.Remove("Authorization");
                policeClient.DefaultRequestHeaders.Add("Authorization", token);
            }
            var policeResponse = await policeClient.GetAsync($"/api/police/status/{vehicle.RegistrationNumber}");

            if (policeResponse.IsSuccessStatusCode)
            {
                var policeData = await policeResponse.Content.ReadAsStringAsync();
                var policeReport = System.Text.Json.JsonDocument.Parse(policeData);
                var outstandingFines = policeReport.RootElement
                    .GetProperty("totalFinesDue")
                    .GetDouble();

                // Block registration request if there are outstanding fines
                if (outstandingFines > 0)
                {
                    return BadRequest(new
                    {
                        message = "Nije moguće poslati zahtev za registraciju - vozilo ima neplaćene kazne",
                        error = $"Neplaćene kazne: {outstandingFines} RSD",
                        fineAmount = outstandingFines,
                        registrationNumber = vehicle.RegistrationNumber,
                        note = "Vodite računa o neplaćenim kaznama pre nego što poslate zahtev za registraciju. Sve kazne moraju biti plaćene."
                    });
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Warning: Could not verify police status for vehicle {VehicleId}", vehicle.Id);
            // Don't block registration request if police check fails - just log the warning
        }

        // Check if there's already a pending request for this vehicle
        var existingPendingRequest = await _db.RegistrationRequests
            .FirstOrDefaultAsync(r => r.VehicleId == dto.VehicleId && r.Status == RegistrationRequestStatus.Pending);

        if (existingPendingRequest != null)
        {
            return BadRequest(new { message = "A pending registration request already exists for this vehicle" });
        }

        // Validation: Technical inspection date must be within the last 30 days
        var daysSinceInspection = (DateTime.Now - dto.TechnicalInspectionDate).TotalDays;
        if (daysSinceInspection > 30)
        {
            return BadRequest(new { message = "Technical inspection date must be within the last 30 days" });
        }
        if (daysSinceInspection < 0)
        {
            return BadRequest(new { message = "Technical inspection date cannot be in the future" });
        }

        // Create uploads directory if it doesn't exist
        var uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads", "registration-requests");
        Directory.CreateDirectory(uploadsPath);

        // Save documents
        var insuranceDocPath = await SaveFile(dto.InsuranceDoc, uploadsPath, "insurance");
        var inspectionDocPath = await SaveFile(dto.InspectionDoc, uploadsPath, "inspection");
        string? identityDocPath = null;

        // Identity document only required for new registration
        if (dto.Type == RegistrationRequestType.New && dto.IdentityDoc != null)
        {
            identityDocPath = await SaveFile(dto.IdentityDoc, uploadsPath, "identity");
        }

        // Create registration request
        var request = new RegistrationRequest
        {
            VehicleId = dto.VehicleId,
            UserId = userId,
            Type = dto.Type,
            TechnicalInspectionDate = dto.TechnicalInspectionDate,
            InsuranceDocPath = insuranceDocPath,
            InspectionDocPath = inspectionDocPath,
            IdentityDocPath = identityDocPath,
            Status = RegistrationRequestStatus.Pending,
            CreatedAt = DateTime.Now
        };

        _db.RegistrationRequests.Add(request);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Registration request submitted successfully",
            data = new
            {
                request.Id,
                request.VehicleId,
                request.Status,
                request.TechnicalInspectionDate,
                request.CreatedAt
            }
        });
    }

    // GET: api/RegistrationRequests
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var query = _db.RegistrationRequests.Include(r => r.Vehicle).AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<RegistrationRequestStatus>(status, true, out var statusEnum))
        {
            query = query.Where(r => r.Status == statusEnum);
        }

        var requests = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();

        return Ok(new { message = "Registration requests retrieved successfully", data = requests });
    }

    // GET: api/RegistrationRequests/my-requests
    [HttpGet("my-requests")]
    public async Task<IActionResult> GetMyRequests()
    {
        if (!User?.Identity?.IsAuthenticated ?? true)
        {
            return Unauthorized(new { message = "Authentication required" });
        }

        var userId = User.FindFirst("sub")?.Value
                     ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("id")?.Value;

        var requests = await _db.RegistrationRequests
            .Include(r => r.Vehicle)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return Ok(new { message = "Registration requests retrieved successfully", data = requests });
    }

    // GET: api/RegistrationRequests/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var request = await _db.RegistrationRequests
            .Include(r => r.Vehicle)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request == null)
        {
            return NotFound(new { message = "Registration request not found" });
        }

        // Check if user is admin or owner
        var userId = User.FindFirst("sub")?.Value
                     ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("id")?.Value;

        var isAdmin = User.IsInRole("Admin");

        if (!isAdmin && request.UserId != userId)
        {
            return Forbid();
        }

        return Ok(new { message = "Registration request retrieved successfully", data = request });
    }

    // POST: api/RegistrationRequests/{id}/review
    [HttpPost("{id}/review")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Review(int id, [FromBody] ReviewRegistrationRequestDto dto)
    {
        var request = await _db.RegistrationRequests
            .Include(r => r.Vehicle)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request == null)
        {
            return NotFound(new { message = "Registration request not found" });
        }

        // Validation: Only pending requests can be approved
        if (request.Status != RegistrationRequestStatus.Pending)
        {
            return BadRequest(new { message = "Only pending requests can be reviewed" });
        }

        var adminUsername = User.Identity?.Name ?? User.FindFirst("name")?.Value ?? "Admin";

        if (dto.Approve)
        {
            // CHECK: Verify vehicle has no outstanding fines with police before approval
            if (request.Vehicle != null)
            {
                try
                {
                    var policeClient = _httpClientFactory.CreateClient("TrafficPoliceService");
                    var token = Request.Headers["Authorization"].ToString();
                    if (!string.IsNullOrEmpty(token))
                    {
                        policeClient.DefaultRequestHeaders.Remove("Authorization");
                        policeClient.DefaultRequestHeaders.Add("Authorization", token);
                    }
                    var policeResponse = await policeClient.GetAsync($"/api/police/status/{request.Vehicle.RegistrationNumber}");

                    if (policeResponse.IsSuccessStatusCode)
                    {
                        var policeData = await policeResponse.Content.ReadAsStringAsync();
                        var policeReport = System.Text.Json.JsonDocument.Parse(policeData);
                        var outstandingFines = policeReport.RootElement
                            .GetProperty("totalFinesDue")
                            .GetDouble();

                        // Block registration if there are outstanding fines
                        if (outstandingFines > 0)
                        {
                            return BadRequest(new
                            {
                                message = "Nije moguće odobriti registraciju - vozilo ima neplaćene kazne",
                                error = $"Neplaćene kazne: {outstandingFines} RSD",
                                fineAmount = outstandingFines,
                                registrationNumber = request.Vehicle.RegistrationNumber,
                                note = "Vlasnik vozila mora platiti sve neplaćene kazne pre nego što se registracija može odobriti"
                            });
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Warning: Could not verify police status for vehicle {VehicleId}", request.Vehicle.Id);
                    // Don't block approval if police check fails - just log the warning
                }
            }

            // Approve the request
            request.Status = RegistrationRequestStatus.Approved;
            request.ReviewedAt = DateTime.Now;
            request.ReviewedBy = adminUsername;

            // Update vehicle based on request type
            if (request.Vehicle != null)
            {
                if (request.Type == RegistrationRequestType.New)
                {
                    // New registration: Set status to Registered
                    request.Vehicle.Status = VehicleStatus.Registered;
                }
                else if (request.Type == RegistrationRequestType.Renewal)
                {
                    // Renewal: Extend expiration date by 1 year
                    // If vehicle is expired, extend from today, otherwise from current expiration
                    var baseDate = request.Vehicle.ExpirationDate < DateTime.Now
                        ? DateTime.Now
                        : request.Vehicle.ExpirationDate;

                    request.Vehicle.ExpirationDate = baseDate.AddYears(1);

                    // Ensure vehicle status is Registered
                    request.Vehicle.Status = VehicleStatus.Registered;
                }
            }

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Registration request approved successfully",
                data = request
            });
        }
        else
        {
            // Reject the request
            if (string.IsNullOrWhiteSpace(dto.RejectionReason))
            {
                return BadRequest(new { message = "Rejection reason is required when rejecting a request" });
            }

            request.Status = RegistrationRequestStatus.Rejected;
            request.ReviewedAt = DateTime.Now;
            request.ReviewedBy = adminUsername;
            request.RejectionReason = dto.RejectionReason;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Registration request rejected",
                data = request
            });
        }
    }

    private async Task<string> SaveFile(IFormFile file, string uploadsPath, string prefix)
    {
        var fileName = $"{prefix}_{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
        var filePath = Path.Combine(uploadsPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return filePath;
    }
}
