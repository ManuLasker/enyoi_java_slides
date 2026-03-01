// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Lab Arka: Microservicios Reactivos',
  tagline: 'Workshop práctico — Spring WebFlux, Kafka, Clean Architecture & LocalStack',
  favicon: 'img/favicon.png',

  future: {
    v4: true,
  },

  // GitHub Pages config
  url: 'https://manulasker.github.io',
  baseUrl: '/enyoi_java_slides/lab_2_arka_microservicios_reactivos/',
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
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/favicon.png',
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: false,
      },
      navbar: {
        title: 'Lab Arka: Microservicios Reactivos',
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
                label: 'Spring WebFlux',
                href: 'https://docs.spring.io/spring-framework/reference/web/webflux.html',
              },
              {
                label: 'Apache Kafka',
                href: 'https://kafka.apache.org/documentation/',
              },
              {
                label: 'R2DBC',
                href: 'https://r2dbc.io/',
              },
              {
                label: 'LocalStack',
                href: 'https://docs.localstack.cloud/',
              },
              {
                label: 'Clean Architecture - Bancolombia',
                href: 'https://github.com/bancolombia/scaffold-clean-architecture',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} ENYOI Java. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.vsDark,
        additionalLanguages: ['bash', 'yaml', 'json', 'java', 'groovy', 'sql', 'properties'],
      },
      mermaid: {
        theme: {light: 'neutral', dark: 'dark'},
      },
    }),
};

export default config;
