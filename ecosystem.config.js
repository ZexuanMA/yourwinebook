module.exports = {
  apps: [
    {
      name: "wine-prod",
      cwd: "/root/wine-app/apps/web",
      script: "npx",
      args: "next start",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
