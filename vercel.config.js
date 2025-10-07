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
      config: { distDir: "build" } // this is React's default build output folder
    }
  ],
  routes: [
    // All API calls starting with /api go to the backend
    {
      src: "/api/(.*)",
      dest: "/backend/server.js"
    },
    // Everything else goes to the React app
    {
      src: "/(.*)",
      dest: "/frontend/$1"
    }
  ]
};
