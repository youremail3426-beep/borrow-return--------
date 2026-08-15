const fs = require('fs');
try {
    fs.copyFileSync(
        'C:/Users/SMO2567/.gemini/antigravity/brain/2926158b-282a-44ef-95e2-cf2412e436a9/media__1774158618148.jpg', 
        'c:/borrow-return/frontend/src/assets/form-template.jpg'
    );
    console.log('Copy successful');
} catch (e) {
    console.error('Error copying:', e);
}
