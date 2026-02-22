# eUprava Vehicle Registration System - Class Diagram

## PlantUML Code

```plantuml
@startuml eUprava-ClassDiagram

!define AUTHSERVICE_COLOR #E1F5FE
!define VEHICLESERVICE_COLOR #C8E6C9
!define NOTIFICATIONSERVICE_COLOR #FFF9C4

' ========== AUTHSERVICE ==========
package "AuthService" <<AUTHSERVICE_COLOR>> {
    class User {
        + Id: int <<PK>>
        + Username: string <<unique>>
        + PasswordHash: string
        + Email: string <<unique>>
        + Role: string
        + CreatedAt: DateTime
        + LastLoginAt: DateTime?
        + IsActive: bool
    }
}

' ========== VEHICLESERVICE ==========
package "VehicleService" <<VEHICLESERVICE_COLOR>> {
    class Vehicle {
        + Id: int <<PK>>
        + RegistrationNumber: string
        + Make: string
        + Model: string
        + Year: int
        + OwnerName: string
        + OwnerId: string <<FK>>
        + ExpirationDate: DateTime
        + Status: VehicleStatus
    }

    class RegistrationRequest {
        + Id: int <<PK>>
        + VehicleId: int <<FK>>
        + UserId: string
        + Type: RegistrationRequestType
        + Status: RegistrationRequestStatus
        + TechnicalInspectionDate: DateTime
        + InsuranceDocPath: string
        + InspectionDocPath: string
        + IdentityDocPath: string?
        + CreatedAt: DateTime
        + ReviewedAt: DateTime?
        + ReviewedBy: string?
        + RejectionReason: string?
    }

    class VehicleTransfer {
        + Id: int <<PK>>
        + VehicleId: int <<FK>>
        + FromUserId: string
        + ToUserId: string
        + Status: VehicleTransferStatus
        + CreatedAt: DateTime
        + RespondedAt: DateTime?
    }

    class VehicleOwnershipHistory {
        + Id: int <<PK>>
        + VehicleId: int <<FK>>
        + OwnerId: string
        + OwnerName: string
        + FromDate: DateTime
        + ToDate: DateTime?
    }

    enum VehicleStatus {
        Unregistered
        Registered
        Active
        Deregistered
    }

    enum RegistrationRequestType {
        New
        Renewal
    }

    enum RegistrationRequestStatus {
        Pending
        Approved
        Rejected
    }

    enum VehicleTransferStatus {
        Pending
        Accepted
        Rejected
    }
}

' ========== NOTIFICATIONSERVICE ==========
package "NotificationService" <<NOTIFICATIONSERVICE_COLOR>> {
    class Notification {
        + Id: int <<PK>>
        + UserId: int
        + RecipientEmail: string
        + Subject: string
        + Message: string
        + SentDate: DateTime
        + Status: string
        + Type: string
    }
}

' ========== RELATIONSHIPS WITHIN VEHICLESERVICE ==========
Vehicle "1" -- "0..*" RegistrationRequest: has
Vehicle "1" -- "0..*" VehicleTransfer: has
Vehicle "1" -- "1..*" VehicleOwnershipHistory: has

Vehicle -- VehicleStatus: uses
RegistrationRequest -- RegistrationRequestType: uses
RegistrationRequest -- RegistrationRequestStatus: uses
VehicleTransfer -- VehicleTransferStatus: uses

' ========== CROSS-SERVICE RELATIONSHIPS (Logical) ==========
User "1" -- "0..*" Vehicle: owns\n(via OwnerId)
User "1" -- "0..*" Notification: receives\n(via UserId)

note top of User
  **AuthService**
  Port: 5000
  Handles authentication
  and user management
end note

note top of Vehicle
  **VehicleService**
  Port: 5001
  Manages vehicles, registrations,
  transfers, and ownership
end note

note top of Notification
  **NotificationService**
  Port: 5002
  Sends email notifications
  via SMTP (MailKit)
end note

note bottom of Vehicle
  **Key Relationships:**
  - Each vehicle has multiple registration requests
  - Each vehicle has ownership history records
  - Each vehicle can have pending transfers
  - OwnerId links to User in AuthService
end note

note bottom of VehicleOwnershipHistory
  **Ownership Tracking:**
  - ToDate = null means current owner
  - ToDate = set means previous owner
  - Full audit trail of ownership changes
end note

@enduml
```

## Visual Representation (Text-Based)

```
┌──────────────────────────────────────────────────────────────────┐
│                    AUTHSERVICE (Port 5000)                       │
│  ┌────────────────┐                                              │
│  │     User       │                                              │
│  ├────────────────┤                                              │
│  │ Id (PK)        │                                              │
│  │ Username       │                                              │
│  │ PasswordHash   │                                              │
│  │ Email          │                                              │
│  │ Role           │                                              │
│  │ CreatedAt      │                                              │
│  │ LastLoginAt    │                                              │
│  │ IsActive       │                                              │
│  └────────────────┘                                              │
└────────────┬─────────────────────────────────────────────────────┘
             │ owns (via OwnerId)
             │ receives notifications (via UserId)
             │
┌────────────┴─────────────────────────────────────────────────────┐
│                  VEHICLESERVICE (Port 5001)                      │
│  ┌─────────────────┐          ┌──────────────────────┐          │
│  │    Vehicle      │◄────────┤ RegistrationRequest  │          │
│  ├─────────────────┤ 1     * ├──────────────────────┤          │
│  │ Id (PK)         │          │ Id (PK)              │          │
│  │ RegistrationNum │          │ VehicleId (FK)       │          │
│  │ Make            │          │ UserId               │          │
│  │ Model           │          │ Type                 │          │
│  │ Year            │          │ Status               │          │
│  │ OwnerName       │          │ TechnicalInspDate    │          │
│  │ OwnerId (FK)    │          │ InsuranceDocPath     │          │
│  │ ExpirationDate  │          │ InspectionDocPath    │          │
│  │ Status          │          │ IdentityDocPath      │          │
│  └─────────────────┘          │ CreatedAt            │          │
│         │                     │ ReviewedAt           │          │
│         │                     │ ReviewedBy           │          │
│         │ 1                   │ RejectionReason      │          │
│         │                     └──────────────────────┘          │
│         │                                                        │
│         │        *            ┌──────────────────────┐          │
│         └────────────────────►│  VehicleTransfer     │          │
│         │                     ├──────────────────────┤          │
│         │                     │ Id (PK)              │          │
│         │                     │ VehicleId (FK)       │          │
│         │                     │ FromUserId           │          │
│         │                     │ ToUserId             │          │
│         │                     │ Status               │          │
│         │                     │ CreatedAt            │          │
│         │                     │ RespondedAt          │          │
│         │                     └──────────────────────┘          │
│         │                                                        │
│         │        *            ┌──────────────────────┐          │
│         └────────────────────►│ VehicleOwnership     │          │
│                               │ History              │          │
│                               ├──────────────────────┤          │
│                               │ Id (PK)              │          │
│                               │ VehicleId (FK)       │          │
│                               │ OwnerId              │          │
│                               │ OwnerName            │          │
│                               │ FromDate             │          │
│                               │ ToDate (nullable)    │          │
│                               └──────────────────────┘          │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│               NOTIFICATIONSERVICE (Port 5002)                    │
│  ┌─────────────────┐                                             │
│  │  Notification   │                                             │
│  ├─────────────────┤                                             │
│  │ Id (PK)         │                                             │
│  │ UserId          │◄─── Links to User.Id (AuthService)         │
│  │ RecipientEmail  │                                             │
│  │ Subject         │                                             │
│  │ Message         │                                             │
│  │ SentDate        │                                             │
│  │ Status          │                                             │
│  │ Type            │                                             │
│  └─────────────────┘                                             │
└──────────────────────────────────────────────────────────────────┘
```

## Entity Descriptions

### AuthService

**User**
- Core entity for authentication and authorization
- Stores hashed passwords (BCrypt)
- Supports roles: "User" and "Admin"
- Tracks login activity and account status

### VehicleService

**Vehicle**
- Main entity for vehicle information
- Links to User via `OwnerId` (cross-service relationship)
- Status enum tracks registration state (Unregistered → Registered → Active/Deregistered)

**RegistrationRequest**
- Handles new registrations and renewals
- Stores document paths for uploaded files
- Admin reviews and approves/rejects requests
- Cascade delete when vehicle is deleted

**VehicleTransfer**
- Manages ownership transfer workflow
- Pending status until target user accepts/rejects
- Cascade delete when vehicle is deleted

**VehicleOwnershipHistory**
- Complete audit trail of all ownership changes
- `ToDate = null` indicates current owner
- `ToDate != null` indicates previous owner
- Cascade delete when vehicle is deleted

### NotificationService

**Notification**
- Stores all sent notifications (email)
- Tracks delivery status (Pending/Sent/Failed)
- Links to User via `UserId` (cross-service relationship)
- Supports future expansion to SMS

## Key Relationships

### Within VehicleService
- **Vehicle → RegistrationRequest** (1:N, Cascade Delete)
- **Vehicle → VehicleTransfer** (1:N, Cascade Delete)
- **Vehicle → VehicleOwnershipHistory** (1:N, Cascade Delete)

### Cross-Service (Logical)
- **User → Vehicle** (1:N via OwnerId string)
- **User → Notification** (1:N via UserId int)

## Enums

**VehicleStatus**: Unregistered, Registered, Active, Deregistered
**RegistrationRequestType**: New, Renewal
**RegistrationRequestStatus**: Pending, Approved, Rejected
**VehicleTransferStatus**: Pending, Accepted, Rejected

## How to Render PlantUML

1. **Online**: Copy the PlantUML code to https://www.plantuml.com/plantuml/uml/
2. **VS Code**: Install "PlantUML" extension, then right-click and select "Preview Current Diagram"
3. **IntelliJ/Rider**: Built-in PlantUML support
4. **CLI**: Save as `.puml` file and run `plantuml filename.puml`
