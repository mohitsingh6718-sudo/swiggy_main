const http = require("http");
const { spawn } = require("child_process");
const { URL } = require("url");

const PORT = 3000;
const PARCEL_PORT = 1234;
const SWIGGY_MENU_URL = "https://www.swiggy.com/dapi/menu/pl";

const parcel = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["parcel", "index.html", "--port", String(PARCEL_PORT)],
  { stdio: "inherit" },
);

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (requestUrl.pathname === "/api/menu") {
    const swiggyUrl = new URL(SWIGGY_MENU_URL);
    requestUrl.searchParams.forEach((value, key) => {
      swiggyUrl.searchParams.set(key, value);
    });

    try {
      const swiggyResponse = await fetch(swiggyUrl, {
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          referer: "https://www.swiggy.com/",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/137 Safari/537.36",
        },
      });
      const body = await swiggyResponse.text();

      response.writeHead(swiggyResponse.status, {
        "content-type":
          swiggyResponse.headers.get("content-type") || "application/json",
        "access-control-allow-origin": "*",
      });
      response.end(body);
    } catch (error) {
      response.writeHead(502, { "content-type": "application/json" });
      response.end(
        JSON.stringify({ error: "Unable to reach Swiggy menu API" }),
      );
    }
    return;
  }

  if (requestUrl.pathname === "/") {
    response.writeHead(302, { location: `http://localhost:${PARCEL_PORT}/` });
    response.end();
    return;
  }

  response.writeHead(404);
  response.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Proxy running at http://localhost:${PORT}`);
});

const shutdown = () => {
  parcel.kill();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
parcel.on("exit", (code) => {
  if (code && code !== 0) {
    server.close(() => process.exit(code));
  }
});
