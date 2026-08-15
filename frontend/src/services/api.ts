import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'YOUR_GAS_WEB_APP_URL';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'text/plain',
    },
});

api.interceptors.request.use(
    (config: any) => {
        const token = localStorage.getItem('token');
        
        // --- GAS Compatibility Layer ---
        const originalMethod = config.method ? config.method.toUpperCase() : 'GET';
        let originalUrl = config.url || '';
        
        if (!config.params) config.params = {};
        
        // Extract query parameters from URL and put them in config.params
        if (originalUrl.includes('?')) {
            const [pathPart, queryPart] = originalUrl.split('?');
            originalUrl = pathPart;
            const urlParams = new URLSearchParams(queryPart);
            urlParams.forEach((value, key) => {
                config.params[key] = value;
            });
        }
        
        config.params.path = originalUrl;
        
        // Attach token as a param instead of header to avoid CORS Preflight in GAS
        if (token) {
            config.params.token = token;
        }
        
        if (originalMethod === 'GET') {
            config.url = ''; 
        } else {
            config.method = 'POST';
            
            let payload = config.data || {};
            
            config.data = JSON.stringify({
                method: originalMethod,
                path: originalUrl,
                body: payload,
                token: token || '' // also in body just in case
            });
            
            config.url = ''; 
        }

        // DONT set Authorization header because it triggers CORS preflight (OPTIONS) which GAS rejects
        return config;
    },
    (error: any) => Promise.reject(error)
);

// Add a response interceptor to handle GAS success: false pattern
api.interceptors.response.use(
    (response) => {
        // GAS always returns HTTP 200, but we can check the inner statusCode
        if (response.data && (response.data.success === false || response.data.statusCode >= 400)) {
            return Promise.reject({
                response: { data: { message: response.data.error || 'Server Error' }, status: response.data.statusCode }
            });
        }
        
        // Return the inner data so it behaves like a normal API
        if (response.data && response.data.success === true) {
            response.data = response.data.data;
        }
        
        return response;
    },
    (error) => Promise.reject(error)
);

export default api;
