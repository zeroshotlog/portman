import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Portman",
  description: "Local port management tool for macOS",
  base: '/portman/docs/',

  head: [
    ['link', { rel: 'icon', href: '/portman/docs/icon.png' }]
  ],

  themeConfig: {
    logo: '/icon.png',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'MCP', link: '/mcp/setup' },
      { text: 'Download', link: 'https://github.com/zeroshotlog/portman/releases' }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is Portman?', link: '/guide/what-is-portman' },
          { text: 'Getting Started', link: '/guide/getting-started' }
        ]
      },
      {
        text: 'Desktop App',
        items: [
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Active Ports', link: '/guide/active-ports' },
          { text: 'Find Free Ports', link: '/guide/find-free' },
          { text: 'Labels', link: '/guide/labels' }
        ]
      },
      {
        text: 'MCP Server',
        items: [
          { text: 'Setup', link: '/mcp/setup' },
          { text: 'Available Tools', link: '/mcp/tools' }
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'FAQ', link: '/reference/faq' },
          { text: 'Troubleshooting', link: '/reference/troubleshooting' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/zeroshotlog/portman' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 zeroshotlog'
    }
  }
})
