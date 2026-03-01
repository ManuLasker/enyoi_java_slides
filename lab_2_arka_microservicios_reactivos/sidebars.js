/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  labSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Módulos',
      collapsed: false,
      items: [
        'modulos/setup-docker-compose',
        'modulos/kafka-prueba-concepto',
        'modulos/iac-cloudformation',
        'modulos/seguridad-secrets',
        'modulos/microservicio-orders',
        'modulos/ms-orders-implementacion',
        'modulos/ms-inventory-implementacion',
        'modulos/ms-payment-implementacion',
        'modulos/pruebas-e2e',
      ],
    },
  ],
};

export default sidebars;
