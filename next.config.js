/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: false,
  images : {
    domains: ['ratsdao.io']
  },
  webpack: (config) => {
    config.experiments = { 
      asyncWebAssembly: true,
      topLevelAwait: true,
      layers: true
    }
    return config
  }
}
