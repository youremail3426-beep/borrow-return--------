import axios from 'axios';

const test = async () => {
    try {
        const res = await axios.post(
            'https://script.google.com/macros/s/AKfycbzrPJ6X7AWM77IVJTYbHslQcU4taELZ6rQWZfrs_zMNTkPTqOnT7b954ImdpqyTF9T3Ug/exec',
            JSON.stringify({
                method: 'POST',
                path: '/auth/login',
                body: { email: 'admin@admin.com', password: 'smofte' }
            }),
            {
                headers: {
                    'Content-Type': 'text/plain'
                }
            }
        );
        console.log("SUCCESS:", res.data);
    } catch (e) {
        console.log("ERROR:", e.message, e.response?.data);
    }
};

test();
