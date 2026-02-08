// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Lab Docker & LocalStack',
  tagline: 'Workshop práctico de infraestructura AWS local',
  favicon: 'img/favicon.png',

  future: {
    v4: true,
  },

  // GitHub Pages config
  url: 'https://manulasker.github.io',
  baseUrl: '/enyoi_java_slides/lab_1_docker_localstack/',
  organizationName: 'ManuLasker',
  projectName: 'enyoi_java_slides',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    }
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/', // Docs en la raíz
          sidebarPath: './sidebars.js',
        },
        blog: false, // Desactivar blog
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/docker-social-card.png',
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: false,
      },
      navbar: {
        title: 'Lab Docker & LocalStack',
        logo: {
          alt: 'ENYOI Logo',
          src: 'img/logo.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'labSidebar',
            position: 'left',
            label: 'Lab',
          },
          {
            href: 'https://github.com/ManuLasker/enyoi_java_slides',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Lab',
            items: [
              {
                label: 'Introducción',
                to: '/',
              },
            ],
          },
          {
            title: 'Recursos',
            items: [
              {
                label: 'Docker Docs',
                href: 'https://docs.docker.com/',
              },
              {
                label: 'LocalStack',
                href: 'https://docs.localstack.cloud/',
              },
              {
                label: 'AWS CLI',
                href: 'https://aws.amazon.com/cli/',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} ENYOI Java. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.vsDark,
        additionalLanguages: ['bash', 'yaml', 'python', 'json', 'java', 'groovy'],
      },
      mermaid: {
        theme: {light: 'neutral', dark: 'dark'},
      },
    }),
};

export default config;
