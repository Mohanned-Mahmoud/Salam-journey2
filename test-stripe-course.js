const http = require('http');
const payload = {
  items: [
    {
      name: "وأصبحتُ أُمّاً هادئة",
      description: "Course Enrollment",
      amount: 299,
      quantity: 1,
    }
  ],
  metadata: {
    type: "course",
    courseId: "b793a11b-440b-46f9-af73-58db40a5c19f",
    userId: "test-user-id"
  },
  successUrl: "http://localhost:5173/payment-success",
  cancelUrl: "http://localhost:5173/payment-cancel",
};

const data = JSON.stringify(payload);
const req = http.request({
  hostname: '127.0.0.1',
  port: 3100,
  path: '/api/stripe/create-checkout-session',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});
req.on('error', console.error);
req.write(data);
req.end();
