const { contextBridge, ipcRenderer } = require('electron');

// Bridge the frameless-window controls (minimise / maximise / close) to the
// main process so the renderer's own title-bar buttons behave like the real ones.
contextBridge.exposeInMainWorld('winControls', {
  minimize: () => ipcRenderer.send('win:minimize'),
  toggleMaximize: () => ipcRenderer.send('win:toggle-maximize'),
  close: () => ipcRenderer.send('win:close')
});

// Bridge to the Requirement-First calculation engine (main.js registers the
// 'est:*' handlers against engine/engine.js). Every call resolves to
// { ok, data } or { ok:false, error } — never throws across the IPC boundary.
const invoke = (channel) => (...args) => ipcRenderer.invoke(channel, ...args);
contextBridge.exposeInMainWorld('estimating', {
  listProjects: invoke('est:listProjects'),
  getProject: invoke('est:getProject'),
  getScope: invoke('est:getScope'),
  getInstallationDetail: invoke('est:getInstallationDetail'),
  getScopeTree: invoke('est:getScopeTree'),
  getProjectServices: invoke('est:getProjectServices'),
  searchCatalog: invoke('est:searchCatalog'),
  addComponentToScope: invoke('est:addComponentToScope'),
  addServiceToScope: invoke('est:addServiceToScope'),
  removeFromScope: invoke('est:removeFromScope'),
  setServiceQuantity: invoke('est:setServiceQuantity'),
  getCatalogFooting: invoke('est:getCatalogFooting'),
  revertFootingOverride: invoke('est:revertFootingOverride'),
  listProfiles: invoke('est:listProfiles'),
  setInstallationProfile: invoke('est:setInstallationProfile'),
  getRunTotals: invoke('est:getRunTotals'),
  getCostDetail: invoke('est:getCostDetail'),
  getRenditions: invoke('est:getRenditions'),
  getIssueChecklist: invoke('est:getIssueChecklist'),
  calculate: invoke('est:calculate'),
  listProcurementMethods: invoke('est:listProcurementMethods'),
  priceProcurement: invoke('est:priceProcurement'),
  listDispositionMethods: invoke('est:listDispositionMethods'),
  priceDisposition: invoke('est:priceDisposition'),
  calculateCost: invoke('est:calculateCost'),
  issueRendition: invoke('est:issueRendition'),
  reopen: invoke('est:reopen'),
  getCurrentContractedValue: invoke('est:getCurrentContractedValue'),
  listFootingSpecs: invoke('est:listFootingSpecs'),
  setFootingOverride: invoke('est:setFootingOverride'),
  createChangeOrder: invoke('est:createChangeOrder'),
  submitChangeOrder: invoke('est:submitChangeOrder'),
  approveChangeOrder: invoke('est:approveChangeOrder'),
  listChangeOrders: invoke('est:listChangeOrders'),
  getChangeOrderLines: invoke('est:getChangeOrderLines')
});
