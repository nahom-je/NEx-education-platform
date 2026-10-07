const fs = require('fs');
const http = require('http');
const path = require('path');

// 1. Create a dummy test file
const testFilePath = path.join(__dirname, 'test_upload_doc.txt');
fs.writeFileSync(testFilePath, 'Hello World, this is a real uploaded document test!');

// 2. Perform Login to get Token
const loginData = JSON.stringify({ email: "admin@nexplatform.com", password: "AdminPassword123!" });

const loginReq = http.request({
  hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
}, (res) => {
  let lData = '';
  res.on('data', d => lData += d);
  res.on('end', () => {
    const token = JSON.parse(lData).token;
    console.log('✅ Logged in successfully');
    
    // 3. Upload File via Multipart Form-Data
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    let postData = '';
    
    // Append standard fields
    const fields = {
      title: 'Automated Upload Test',
      type: 'notes',
      university: 'AAU',
      courseCode: 'TEST101',
      courseName: 'Test Engineering',
      academicYear: '2024 GC',
      description: 'Test file upload',
      tags: 'test, automation'
    };
    
    for (const [key, value] of Object.entries(fields)) {
       postData += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`;
    }
    
    // Append File
    const fileContent = fs.readFileSync(testFilePath);
    postData += `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test_upload_doc.txt"\r\nContent-Type: text/plain\r\n\r\n`;
    
    const endBoundary = `\r\n--${boundary}--\r\n`;
    
    const payload = Buffer.concat([
      Buffer.from(postData, 'utf8'),
      fileContent,
      Buffer.from(endBoundary, 'utf8')
    ]);
    
    const uploadReq = http.request({
      hostname: 'localhost', port: 5000, path: '/api/resources', method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': payload.length
      }
    }, (uRes) => {
      let uData = '';
      uRes.on('data', d => uData += d);
      uRes.on('end', () => {
         console.log(`Upload status: ${uRes.statusCode}`);
         console.log(uData);
         if(uRes.statusCode === 200) {
           console.log('✅ File uploaded successfully!');
           const resource = JSON.parse(uData);
           console.log(`🔗 Link generated: ${resource.fileUrl}`);
         }
      });
    });
    
    uploadReq.write(payload);
    uploadReq.end();
  });
});

loginReq.write(loginData);
loginReq.end();
