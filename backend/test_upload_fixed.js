const fetch = require('node-fetch'); // Let's use fetch instead for easier FormData simulation if you had it, but node fetch isn't guaranteed.
const fs = require('fs');
const http = require('http');
const path = require('path');

async function runTest() {
  const testFilePath = path.join(__dirname, 'test_doc.txt');
  fs.writeFileSync(testFilePath, 'Real file test content here');

  // Login
  const loginData = JSON.stringify({ email: "admin@nexplatform.com", password: "AdminPassword123!" });
  
  const loginRes = await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data).token));
    });
    req.write(loginData);
    req.end();
  });

  const boundary = '----WebKitFormBoundary' + Math.random().toString(16);
  let payload = '';

  const fields = {
    title: 'Proper Multipart Test',
    type: 'notes',
    university: 'AAU',
    courseCode: 'TEST102',
    courseName: 'Test Automation',
    academicYear: '2024 GC'
  };

  for (const [key, value] of Object.entries(fields)) {
    payload += `--${boundary}\r\n`;
    payload += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
    payload += `${value}\r\n`;
  }

  // File
  payload += `--${boundary}\r\n`;
  payload += `Content-Disposition: form-data; name="file"; filename="test_doc.txt"\r\n`;
  payload += `Content-Type: text/plain\r\n\r\n`;
  
  const fileContent = fs.readFileSync(testFilePath);
  
  const endBoundary = `\r\n--${boundary}--\r\n`;

  const finalBody = Buffer.concat([
    Buffer.from(payload, 'utf-8'),
    fileContent,
    Buffer.from(endBoundary, 'utf-8')
  ]);

  const req = http.request({
    hostname: 'localhost', port: 5000, path: '/api/resources', method: 'POST',
    headers: {
      'Authorization': `Bearer ${loginRes}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': finalBody.length
    }
  }, (res) => {
    let output = '';
    res.on('data', d => output += d);
    res.on('end', () => console.log('Response:', res.statusCode, output));
  });

  req.write(finalBody);
  req.end();
}

runTest();
