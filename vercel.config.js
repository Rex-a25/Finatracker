export default {
  version: 2,
  builds: [
    {
      src: "backend/server.js",
      use: "@vercel/node"
    },
    {
      src: "frontend/package.json",
      use: "@vercel/static-build",
      config: { distDir: "build" }
    }
  ],
  routes: [
    {
      src: "/api/(.*)",
      dest: "/backend/server.js"
    },
    // ✅ Fallback: send every non-API route to index.html in the build folder
    {
      src: "/(.*)",
      dest: "/frontend/build/index.html"
    }
  ]
};
