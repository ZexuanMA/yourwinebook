module.exports = {
  apps: [
    {
      name: "wine-staging",
      cwd: "/root/wine-app/apps/web",
      script: "npx",
      args: "next start --port 3002",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: "3002",
      },
    },
  ],
};
