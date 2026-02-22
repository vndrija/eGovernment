// Docker environment
export const environment = {
  production: true,
  apiConfig: {
    authService: 'http://localhost:5005/api/auth',
    vehicleService: 'http://localhost:5001/api/vehicles',
    vehicleTransfers: 'http://localhost:5001/api/VehicleTransfers',
    registrationRequests: 'http://localhost:5001/api/RegistrationRequests',
    trafficPoliceService: 'http://localhost:5003/api/police'
  }
};
