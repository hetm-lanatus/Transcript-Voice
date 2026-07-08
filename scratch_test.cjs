const https = require('https');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const apiKey = process.env.VITE_SPEECHMATICS_API_KEY;
if (!apiKey) {
  console.log("No VITE_SPEECHMATICS_API_KEY found");
  process.exit(1);
}

const data = JSON.stringify({ ttl: 60, type: "rt" });

const options = {
  hostname: 'mp.speechmatics.com',
  port: 443,
  path: '/v1/api_keys?type=rt',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
