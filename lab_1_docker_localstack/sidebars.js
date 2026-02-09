/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  labSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Módulos',
      collapsed: false,
      items: [
        'modulos/configuracion-inicial',
        'modulos/s3-almacenamiento',
        'modulos/sqs-mensajeria',
        'modulos/secrets-manager',
        'modulos/lambda-api-gateway',
        'modulos/stack-completo',
      ],
    },
    'limpieza',
  ],
};

export default sidebars;
