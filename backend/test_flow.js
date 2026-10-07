const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Register status: ${res.statusCode}`);
    console.log(`Register response: ${data}`);
    
    if(res.statusCode === 200) {
      console.log('✅ Registration successful!');
      
      const loginOpts = { ...options, path: '/api/auth/login' };
      const loginReq = http.request(loginOpts, (lRes) => {
        let lData = '';
        lRes.on('data', (chunk) => { lData += chunk; });
        lRes.on('end', () => {
          console.log(`Login status: ${lRes.statusCode}`);
          if(lRes.statusCode === 200) {
             console.log('✅ Login successful!');
          }
        });
      });
      loginReq.write(JSON.stringify({ email: "apitest44@test.com", password: "Password123!" }));
      loginReq.end();
    }
  });
});

req.on('error', (error) => { console.error(error); });
req.write(JSON.stringify({ name: "API Tester 44", email: "apitest44@test.com", password: "Password123!" }));
req.end();
