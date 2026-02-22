# eGovernment
This is a project with 2 developed systems for eGovernment: MUP Vehicles (Andrija) and Traffic Police (Vukasin).

MUP Vehicles is developed using C#/.NET for backend.

Traffic Police is developed using Go fro backend.

Frontend is done in Angular.

Database is done with Microsoft SQL server.

Containerization with Docker single sign-on for user authentication and a microservices architecture for communication between different services.

Mailtrap for email notifications.

### Installation guide

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/euprava-vehicle-registration.git
cd euprava-vehicle-registration
```

2. **Run with Docker Compose (Recommended)**
```bash
docker-compose up --build
```
### Description for MUP Vehicles:

The VehicleService is the core component of the eUprava system, developed after analyzing the Serbian Ministry of Internal Affairs (MUP) vehicle registration portal at mup.gov.rs.

#### Implemented Features

1. CRUD for Vehicles - Create, read, update, and delete vehicle records.

2. Registration of Vehicles - Submit new registration requests with document uploads (insurance, technical inspection, identity documents).

3. Renewal of Registration - Extend vehicle registration (1 year) with document submission.

4. Change of Plates - Request new registration plates with reason (damaged, lost, stolen, personalized).

5. Deregister Vehicle - Remove vehicle from active registration.

6. Ownership Transfer - Two-step transfer process where new owner must accept the transfer.

7. Traffic Police Integration - Check for unpaid fines and stolen status before approval.

8. Expiration Tracking - Automatic notifications 30 days before registration expires.

9. Ownership History - Complete audit trail of all previous owners.

# Images of the project

Home page (before login):
<img width="1902" height="946" alt="pocetna" src="https://github.com/user-attachments/assets/57b5f9b8-8b4b-4809-86f3-0c3760d2c82d" />

Login:
<img width="1917" height="945" alt="prijava" src="https://github.com/user-attachments/assets/cef367de-1c13-47c1-921c-7e17fb34fa4e" />

Home page (logged in):
<img width="1905" height="938" alt="pocetnaLogin" src="https://github.com/user-attachments/assets/e335c396-fc63-4fc0-a85b-890909155723" />

MUP Vehicles main page:
<img width="1906" height="938" alt="mupVozilaPocetna" src="https://github.com/user-attachments/assets/5f84a9f7-cb03-403f-a193-dc9cac17e882" />

Profile page:
<img width="1901" height="942" alt="profilMup" src="https://github.com/user-attachments/assets/45d63f34-e429-464b-89cb-93ea617c3649" />

Vehicle registartion:
<img width="1903" height="938" alt="registracija" src="https://github.com/user-attachments/assets/4cd89dd8-df30-4465-b70e-b6cc3386821c" />

Vehicle deregistartion:
<img width="1901" height="942" alt="odjava" src="https://github.com/user-attachments/assets/a307207b-793f-4d0b-a5e6-c563decca5a5" />

Plate change:
<img width="1906" height="937" alt="PROMENA TABLICE" src="https://github.com/user-attachments/assets/9bc53d4d-fb12-4aa8-a42f-448b196aef7d" />
<img width="791" height="885" alt="pdfPromene" src="https://github.com/user-attachments/assets/23fa0c62-1eae-4420-9250-5df2d9db947b" />

Vehicle details:
<img width="1903" height="942" alt="detaljiVozila" src="https://github.com/user-attachments/assets/314f5013-d953-4905-b76d-42b1f32341b8" />

Vehicle transfer: 
<img width="1901" height="942" alt="prenosVozila" src="https://github.com/user-attachments/assets/1d74f0b2-3316-4e7e-9d75-5be248a8689d" />

Mail notification:
<img width="1898" height="905" alt="Notifikacije" src="https://github.com/user-attachments/assets/cb7a0d5b-a2ff-42f1-b60e-577319b38746" />



