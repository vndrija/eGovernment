// Development environment (ng serve / localhost)
export const environment = {
  production: false,
  apiConfig: {
    authService: 'http://localhost:5005/api/auth',
    vehicleService: 'http://localhost:5001/api/vehicles',
    vehicleTransfers: 'http://localhost:5001/api/VehicleTransfers',
    registrationRequests: 'http://localhost:5001/api/RegistrationRequests',
    trafficPoliceService: 'http://localhost:5004/api/police'
  }
};
