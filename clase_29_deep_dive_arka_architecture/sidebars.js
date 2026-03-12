/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    'intro',
    'resumen-arquitectonico',
    {
      type: 'category',
      label: 'Historias de Usuario',
      collapsed: false,
      items: [
        'hu1-registrar-producto',
        'hu2-actualizar-stock',
        'hu3-alertas-stock',
        'hu4-registrar-orden',
        'hu5-historial-ordenes',
        'hu6-notificaciones',
        'hu7-reportes',
        'hu8-carrito-compras',
      ],
    },
    {
      type: 'category',
      label: 'Extras',
      collapsed: false,
      items: [
        'extra-auth-api-gateway',
        'extra-ms-payment',
        'extra-ms-provider',
      ],
    },
    'drawio-referencia',
  ],
};

export default sidebars;
