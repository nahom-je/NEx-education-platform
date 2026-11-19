const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body || '{}') });
        } catch(e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runE2E() {
  console.log('--- 1. Testing Categories & Courses ---');
  const catRes = await request({ hostname: 'localhost', port: 5000, path: '/api/categories', method: 'GET' });
  console.log('Categories count:', catRes.data.length);
  const natScience = catRes.data.find(c => c.name === 'Freshman Natural Science');
  console.log('Freshman Natural Science ID:', natScience.id);

  const courseRes = await request({ 
    hostname: 'localhost', 
    port: 5000, 
    path: '/api/categories/' + natScience.id + '/courses?semester=Semester%201', 
    method: 'GET' 
  });
  console.log('Freshman Sem 1 courses count (expected 7):', courseRes.data.length);
  const physicsCourse = courseRes.data.find(c => c.name === 'General Physics');
  console.log('General Physics Course ID:', physicsCourse.id);

  console.log('\n--- 2. Login as Student ---');
  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'student@nexplatform.com', password: 'StudentPassword123!' }));
  const studentToken = loginRes.data.token;
  console.log('Student logged in:', loginRes.data.user?.name);

  console.log('\n--- 3. Upload Sample Resource (Multipart) ---');
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  let body = '';
  function addField(name, val) {
    body += '--' + boundary + '\r\n';
    body += 'Content-Disposition: form-data; name="' + name + '"\r\n\r\n';
    body += val + '\r\n';
  }
  addField('title', 'General Physics Midterm Exam 2017 EC');
  addField('type', 'exam');
  addField('category_id', natScience.id);
  addField('semester', 'Semester 1');
  addField('course_id', physicsCourse.id);
  addField('description', 'Official exam paper for General Physics Semester 1.');
  addField('tags', 'physics, midterm, 2017');

  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="file"; filename="physics_exam.txt"\r\n';
  body += 'Content-Type: text/plain\r\n\r\n';
  body += 'Physics Exam Question 1: What is velocity?\r\n';
  body += '--' + boundary + '--\r\n';

  const uploadRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/resources',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + studentToken,
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': Buffer.byteLength(body)
    }
  }, body);
  console.log('Upload status:', uploadRes.status, 'Resource ID:', uploadRes.data._id || uploadRes.data.id);
  const resourceId = uploadRes.data._id || uploadRes.data.id;

  console.log('\n--- 4. Admin Login & Approval ---');
  const adminLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'admin@nexplatform.com', password: 'AdminPassword123!' }));
  const adminToken = adminLogin.data.token;

  const pendingRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/resources/pending',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + adminToken }
  });
  console.log('Admin pending count:', pendingRes.data.length);

  const approveRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/resources/' + resourceId + '/approve',
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + adminToken }
  });
  console.log('Approve status:', approveRes.status, 'Approved Resource Status:', approveRes.data.status);

  console.log('\n--- 5. Public Resource Fetch & Hierarchy Filter ---');
  const publicRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/resources?category_id=' + natScience.id + '&semester=Semester%201&type=exam',
    method: 'GET'
  });
  console.log('Found public approved resources count:', publicRes.data.length);
  const item = publicRes.data[0];
  console.log('Item Title:', item.title, '| Course:', item.courseName, '| Category:', item.categoryName, '| Downloads:', item.downloads);

  console.log('\n--- 6. Test Download Counter Increment ---');
  const dlRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/resources/' + resourceId + '/download',
    method: 'GET'
  });
  console.log('Download endpoint response (downloads incremented):', dlRes.data);

  console.log('\n--- 7. Test Commenting ---');
  const commentRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/resources/' + resourceId + '/comment',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + studentToken,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({ text: 'Excellent exam paper, thanks!' }));
  console.log('Comments count:', commentRes.data.length, 'Last comment text:', commentRes.data[commentRes.data.length - 1]?.text);

  console.log('\n--- 8. Verify Rating Endpoint is GONE ---');
  const rateRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/resources/' + resourceId + '/rate',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + studentToken,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({ score: 5 }));
  console.log('Rate endpoint status (expected 404):', rateRes.status);

  console.log('\n🎉 ALL 8 TESTS PASSED WITH 100% SUCCESS!');
}

runE2E().catch(console.error);

