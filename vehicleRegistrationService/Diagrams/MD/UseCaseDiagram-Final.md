# Use Case Dijagram: Sistem eUprave - Registracija i Saobraćajna Policija

Ovaj dokument sadrži PlantUML kod za Use Case dijagram koji detaljno prikazuje sve slučajeve upotrebe razdvojene po akterima (Građanin, Službenik MUP-a i Sistem).

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle
skinparam usecase {
  BackgroundColor LightBlue
  BorderColor DarkBlue
  ArrowColor Black
}

actor "Građanin" as Citizen
actor "Službenik MUP-a
(Admin / Saobraćajac)" as Admin
actor "Sistem
(Background Services)" as System

package "Autentifikacija (AuthService)" {
  usecase "Registracija naloga" as UC_Reg
  usecase "Prijava (Login)" as UC_Login
  usecase "Ažuriranje profila" as UC_Profile
}

package "Registracija i Vozila (VehicleService)" {
  usecase "Dodavanje novog vozila" as UC_AddVehicle
  usecase "Podnošenje zahteva za registraciju" as UC_RegReq
  usecase "Promena registarskih tablica
(PDF + Potpis)" as UC_Plate
  usecase "Iniciranje prenosa vlasništva" as UC_InitTrans
  usecase "Prihvatanje/Odbijanje prenosa" as UC_RespTrans
  usecase "Obrada zahteva za registraciju" as UC_ProcReq
}

package "Saobraćajna Policija (TrafficPoliceService)" {
  usecase "Prijava ukradenog vozila" as UC_Stolen
  usecase "Pregled ličnih prekršaja i nezgoda" as UC_ViewViolations
  usecase "Plaćanje saobraćajne kazne
(PDF + Potpis)" as UC_PayFine
  usecase "Preuzimanje PDF uplatnice" as UC_PDF

  usecase "Pregled dosijea vozila" as UC_Dossier
  usecase "Izdavanje saobraćajnog prekršaja" as UC_IssueViolation
  usecase "Evidentiranje saobraćajne nezgode" as UC_Accident
  usecase "Dodavanje poternice (Markiranje)" as UC_Flag
  usecase "Uklanjanje poternice (Razrešavanje)" as UC_Unflag
  usecase "Upravljanje službenicima" as UC_Officers
}

package "Automatske Integracije i Radnje" {
  usecase "Provera legalnosti vozila
(Krađa, Kazne, Poternice)" as UC_AutoCheck
  usecase "Slanje Email obaveštenja" as UC_Email
  usecase "Blokada vozila u registru
(Obaveštavanje VehicleService-a)" as UC_NotifyVS
  usecase "Provera isteka registracije" as UC_CheckExp
}

' --- Asocijacije Građanina ---
Citizen --> UC_Reg
Citizen --> UC_Login
Citizen --> UC_Profile

Citizen --> UC_AddVehicle
Citizen --> UC_RegReq
Citizen --> UC_Plate
Citizen --> UC_InitTrans
Citizen --> UC_RespTrans

Citizen --> UC_Stolen
Citizen --> UC_ViewViolations
Citizen --> UC_PayFine
Citizen --> UC_PDF

' --- Asocijacije Službenika ---
Admin --> UC_Login
Admin --> UC_ProcReq

Admin --> UC_Dossier
Admin --> UC_IssueViolation
Admin --> UC_Accident
Admin --> UC_Flag
Admin --> UC_Unflag
Admin --> UC_Officers

' --- Sistemske Akcije i Inkluzije ---
System --> UC_CheckExp
UC_CheckExp ..> UC_Email : <<include>>

UC_ProcReq ..> UC_AutoCheck : <<include>>
UC_IssueViolation ..> UC_Email : <<include>>
UC_Accident ..> UC_NotifyVS : <<include>>
UC_Stolen ..> UC_NotifyVS : <<include>>
UC_PayFine ..> UC_Email : <<extend>> (Opciono, potvrda uplate)

@enduml
```
