const B2 = require('backblaze-b2');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
            envVars[trimmed.substring(0, eqIdx).trim()] = trimmed.substring(eqIdx + 1).trim();
        }
    }
});

// Use env vars
const KEY_ID = envVars.B2_KEY_ID || '005b3c970d8861d0000000005';
const APPLICATION_KEY = envVars.B2_APPLICATION_KEY || 'K0053XgeBlHA/cm+Xl9StK17zZIRd2Q';
const BUCKET_ID = envVars.B2_BUCKET_ID || 'da64782e47e1ac5f97a30916';

async function updateCorsRules() {
    console.log('Connecting to Backblaze B2...');
    console.log('Using Key ID:', KEY_ID.substring(0, 8) + '...');
    
    const b2 = new B2({
        applicationKeyId: KEY_ID,
        applicationKey: APPLICATION_KEY,
    });

    try {
        await b2.authorize();
        console.log('Authorized successfully!');

        const newRule = {
            corsRuleName: 'allowWebUploads',
            allowedOrigins: [
                'https://sharedspacesoi.com',
                'https://www.sharedspacesoi.com',
                'http://localhost:3000'
            ],
            allowedHeaders: [
                'authorization',
                'content-type',
                'content-length',
                'x-bz-file-name',
                'x-bz-content-sha1',
                'x-bz-info-src_last_modified_millis',
                'x-bz-part-number',
                'range'
            ],
            allowedOperations: [
                'b2_download_file_by_id',
                'b2_download_file_by_name',
                'b2_upload_file',
                'b2_upload_part',
                's3_head',
                's3_get',
                's3_put',
                's3_post',
                's3_delete'
            ],
            exposeHeaders: [
                'x-bz-content-sha1',
                'x-bz-file-name',
                'x-bz-file-id',
                'x-bz-info-src_last_modified_millis'
            ],
            maxAgeSeconds: 86400
        };

        console.log('Fetching current bucket settings...');
        const bucketRes = await b2.getBucket({ bucketId: BUCKET_ID });
        const bucket = bucketRes.data.buckets[0];
        const bucketType = bucket.bucketType;
        
        // Keep existing rules, but replace 'allowWebUploads' if it already exists
        let corsRules = bucket.corsRules || [];
        corsRules = corsRules.filter(r => r.corsRuleName !== 'allowWebUploads');
        corsRules.push(newRule);

        console.log('Applying new CORS rules to bucket...');
        const response = await b2.updateBucket({
            bucketId: BUCKET_ID,
            bucketType: bucketType,
            corsRules: corsRules
        });

        console.log('\n✅ SUCCESS! CORS rules applied successfully.');
        console.log('New Rules Active on Bucket:', BUCKET_ID);
        console.log(JSON.stringify(response.data.corsRules, null, 2));

    } catch (err) {
        console.error('\n❌ FAILED to update CORS rules:');
        if (err.response && err.response.data) {
            console.error(err.response.data);
        } else {
            console.error(err.message);
        }
        console.error('\nMake sure your B2_KEY_ID and B2_APPLICATION_KEY are valid.');
        console.error('You can generate new keys at: https://secure.backblaze.com/app_keys.htm');
    }
}

updateCorsRules();
