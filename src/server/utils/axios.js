import axios from "axios";

const http = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true 
});

http.interceptors.response.use(
    (response) => {
        // If the request is successful, just return the data
        return response;
    },
    (error) => {
        // Requirement 2.2.2: Fail Securely
        // If the server returns 401 (Unauthorized), the session is invalid
        if (error.response && error.response.status === 401) {
            console.warn("Unauthorized access detected - redirecting to login.");
            
            // Clear any local state if necessary and redirect
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default http;