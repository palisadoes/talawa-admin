import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Talawa-Admin Documentation',
  tagline: 'Complete guides and references for building with Talawa',
  favicon: 'img/icons/favicon_palisadoes.ico',

  url: 'https://docs-admin.talawa.io',
  baseUrl: '/',
  deploymentBranch: 'gh-pages',

  organizationName: 'PalisadoesFoundation', // GitHub org
  projectName: 'talawa-admin', // repo name

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: ({ docPath }) => {
            return `https://github.com/PalisadoesFoundation/talawa-admin/edit/develop/docs/docs/${docPath}`;
          },
        },
        blog: {
          showReadingTime: true,
          editUrl:
            'https://github.com/PalisadoesFoundation/talawa-admin/tree/develop/docs/docs',
        },
        theme: {
          customCss: [require.resolve('./src/css/custom.css')],
        },
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    {
      docs: {
        sidebar: {
          hideable: false,
        },
      },
      navbar: {
        title: 'Talawa',
        logo: {
          alt: 'Talawa Logo',
          src: 'img/icons/favicon_palisadoes.ico',
          className: 'LogoAnimation',
        },
        items: [
          {
            label: 'General',
            position: 'left',
            href: 'https://docs.talawa.io/docs',
            target: '_self',
          },
          {
            label: 'Mobile Guide',
            position: 'left',
            href: 'https://docs-mobile.talawa.io/docs',
            target: '_self',
          },
          {
            label: 'Admin Guide',
            position: 'left',
            href: '/docs',
            target: '_self',
          },
          {
            label: 'API Guide',
            position: 'left',
            href: 'https://docs-api.talawa.io/docs',
            target: '_self',
          },

          {
            label: 'Demo',
            position: 'left',
            href: 'http://admin-demo.talawa.io/',
          },
          {
            to: 'https://github.com/PalisadoesFoundation',
            position: 'right',
            className: 'header-github-link',
            'aria-label': 'GitHub repository',
          },
          {
            to: 'https://www.youtube.com/@PalisadoesOrganization',
            position: 'right',
            className: 'header-youtube-link',
            'aria-label': 'Palisadoes Youtube channel',
          },
        ],
      },
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: false,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    },
};

export default config;
