
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/services",
    "route": "/"
  },
  {
    "renderMode": 2,
    "route": "/home"
  },
  {
    "renderMode": 2,
    "route": "/services"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 502, hash: 'ad89d58622211221c8501b008081c622abd46de4e2912ea562a90f968c8e2bfb', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1015, hash: '2ff047d77c6eefe6e559a0a208dad2df3d166d565ce88271d26485e2dd46b7bd', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'services/index.html': {size: 11701, hash: '1960fe02dcc62a15350dfb795e14a8157e4c3f619e1bc4c57dae87e51da6238f', text: () => import('./assets-chunks/services_index_html.mjs').then(m => m.default)},
    'home/index.html': {size: 11912, hash: '887a46e3c4325674dc85f5feca025da88dd9559cde20a2796754cddcbdd04820', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'styles-5INURTSO.css': {size: 0, hash: 'menYUTfbRu8', text: () => import('./assets-chunks/styles-5INURTSO_css.mjs').then(m => m.default)}
  },
};
