// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Deep Dive ARKA Architecture',
  tagline: 'Diseño arquitectonico B2B con microservicios, eventos y sagas',
  favicon: 'img/favicon.png',

  future: {
    v4: true,
  },

  // GitHub Pages config
  url: 'https://manulasker.github.io',
  baseUrl: '/enyoi_java_slides/clase_29_deep_dive_arka_architecture/',
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
        title: 'Deep Dive ARKA',
        logo: {
          alt: 'ENYOI Logo',
          src: 'img/logo.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docsSidebar',
            position: 'left',
            label: 'Arquitectura',
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
            title: 'Deep Dive',
            items: [
              {
                label: 'Inicio',
                to: '/',
              },
              {
                label: 'Draw.io Base',
                to: '/drawio-referencia',
              },
            ],
          },
          {
            title: 'Recursos',
            items: [
              {
                label: 'Mermaid Docs',
                href: 'https://mermaid.js.org/',
              },
              {
                label: 'Diagrams.net',
                href: 'https://app.diagrams.net/',
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
        options: {
          sequence: {
            useMaxWidth: false,
          },
          flowchart: {
            useMaxWidth: false,
          },
        },
      },
    }),
};

export default config;
