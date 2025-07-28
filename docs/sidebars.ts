import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  userGuideSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'user-guide/getting-started',
        'user-guide/first-login',
        'user-guide/dashboard-overview',
      ],
    },
    {
      type: 'category',
      label: 'Client Management',
      items: [
        'user-guide/clients/adding-clients',
        'user-guide/clients/editing-clients',
        'user-guide/clients/client-details',
      ],
    },
    {
      type: 'category',
      label: 'Invoice Management',
      items: [
        'user-guide/invoices/creating-invoices',
        'user-guide/invoices/invoice-templates',
      ],
    },
  ],

  adminGuideSidebar: [
    {
      type: 'category',
      label: 'Installation & Setup',
      items: [
        'admin-guide/installation',
        'admin-guide/environment-variables',
        'admin-guide/google-sheets-setup',
      ],
    },
  ],

  apiSidebar: [
    'api/overview',
    {
      type: 'category',
      label: 'Authentication',
      items: [
        'api/authentication/oauth',
      ],
    },
    {
      type: 'category',
      label: 'Endpoints',
      items: [
        'api/endpoints/clients',
      ],
    },
  ],

  faqSidebar: [
    'faq/general',
    'faq/setup-issues',
  ],
};

export default sidebars;
