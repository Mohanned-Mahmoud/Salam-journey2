const http = require("http");

const data = JSON.stringify({
  items: [{ name: "Test", description: "Test", amount: 100, quantity: 1 }],
  metadata: { type: "test" },
  successUrl: "http://localhost:5173/success",
  cancelUrl: "http://localhost:5173/cancel",
});

const req = http.request(
  {
    hostname: "localhost",
    port: 3100,
    path: "/api/stripe/create-checkout-session",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": data.length,
    },
  },
  (res) => {
    let body = "";
    res.on("data", (chunk) => { body += chunk; });
    res.on("end", () => {
      console.log("Status:", res.statusCode);
      console.log("Body:", body);
    });
  }
);
req.on("error", (e) => console.error(e));
req.write(data);
req.end();
