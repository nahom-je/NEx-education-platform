const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if(res.statusCode === 200) {
      const token = JSON.parse(data).token;
      console.log('✅ Admin login successful');
      
      const pendingOpts = {
        ...options,
        path: '/api/admin/resources/pending',
        method: 'GET',
        headers: {
           ...options.headers,
           'Authorization': `Bearer ${token}`
        }
      };
      
      const pendingReq = http.request(pendingOpts, (pRes) => {
         let pData = '';
         pRes.on('data', (c) => { pData += c; });
         pRes.on('end', () => {
           console.log(`Pending resources status: ${pRes.statusCode}`);
           if (pRes.statusCode === 200) {
             console.log(`✅ Success fetching pending resources`);
             console.log(JSON.parse(pData));
           } else {
             console.log(pData);
           }
         });
      });
      pendingReq.end();
    } else {
      console.error('Login failed', data);
    }
  });
});

req.on('error', (error) => { console.error(error); });
req.write(JSON.stringify({ email: "admin@nexplatform.com", password: "AdminPassword123!" }));
req.end();
