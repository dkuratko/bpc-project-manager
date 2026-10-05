'use strict';

/**
 * The only path between a screen and the database.
 *
 * Screens get `bpc.all/get/run` and nothing else — no fs, no require, no
 * node. A SQL error comes back as a value rather than a thrown exception,
 * because a screen that cannot read one table should still draw.
 */

const { contextBridge, ipcRenderer } = require('electron');

const unwrap = (key) => async (...args) => {
  const res = await ipcRenderer.invoke(key, ...args);
  if (res && res.error) throw new Error(res.error);
  return res;
};

contextBridge.exposeInMainWorld('bpc', {
  all: async (sql, params = []) => (await unwrap('db:all')(sql, params)).rows,
  get: async (sql, params = []) => (await unwrap('db:get')(sql, params)).row,
  run: async (sql, params = []) => await unwrap('db:run')(sql, params),

  /* Domain calls — anything that needs a derivation. */
  board:   async () => await unwrap('domain:board')(),
  version: async (id) => (await unwrap('domain:version')(id)).version,
  contacts: async (opts) => (await unwrap('domain:contacts')(opts)).list,
  setContactActive: async (opts) => await unwrap('domain:contact-active')(opts),

  frame: {
    minimize: () => ipcRenderer.invoke('frame:minimize'),
    maximize: () => ipcRenderer.invoke('frame:maximize'),
    close:    () => ipcRenderer.invoke('frame:close'),
  },
});
