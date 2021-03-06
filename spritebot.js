'use strict';

const {app, ipcMain, BrowserWindow, dialog, Menu} = require('electron');
const is = require('electron-is');

const appMenu = require(__dirname + '/app/main/menu/app-menu');
const menuFile = require(__dirname + '/app/main/menu/helpers/file');
const menuEdit = require(__dirname + '/app/main/menu/helpers/edit');
const menuHelp = require(__dirname + '/app/main/menu/helpers/help');

const env = process.env.NODE_ENV;

let appPkg = require(__dirname + '/package.json');
let mainWindow;
let droppedFiles = [];

const bindMenus = function () {
  menuFile.bind(appMenu, mainWindow.id);
  menuEdit.bind(appMenu, mainWindow.id);
  menuHelp.bind(appMenu, mainWindow.id);
};

const createMainWindow = function (next) {
  mainWindow = new BrowserWindow({
    width: 700,
    minWidth: 600,
    height: 400,
    show: false,
    minHeight: 400,
    vibrancy: 'light',
  });

  mainWindow.loadURL('file://' + __dirname + '/app/renderer/windows/main/main.html');
  bindMenus();

  if (env === 'development') mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;

    if (!is.macOS()) app.quit();
  });

  mainWindow.on('focus', function () {
    mainWindow.webContents.send('app:focus');
  });

  mainWindow.on('blur', function () {
    mainWindow.webContents.send('app:blur');
  });

  mainWindow.once('ready-to-show', function () {
    mainWindow.show();

    if (next) next();
  });
};

const updateAppMenu = function () {
  Menu.setApplicationMenu(Menu.buildFromTemplate(appMenu.getMenuTemplate()));
};

app.on('ready', function () {
  updateAppMenu();
  createMainWindow();
});

app.on('window-all-closed', function () {
  if (!is.macOS()) app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createMainWindow();
});

app.on('open-file', function (e, filepath) {
  e.preventDefault();

  if (typeof filepath === 'string') droppedFiles.push(filepath);

  if (mainWindow === null) {
    createMainWindow(function () {
      mainWindow.webContents.send('app:add-files', JSON.parse(JSON.stringify(droppedFiles)));
    });
  } else {
    mainWindow.webContents.send('app:add-files', JSON.parse(JSON.stringify(droppedFiles)));
  }
});

ipcMain.on('app:clear-file-list', () => {
  droppedFiles = [];
});

ipcMain.on('app:show-save-dialog', function (e, arg) {
  menuFile.trigger('app:save-sprite-sheet');
});

ipcMain.on('app:show-add-dialog', function (e, arg) {
  menuFile.trigger('app:add-files');
});

ipcMain.on('menu:enable-file-items', function () {
  appMenu.updateMenuItem('file,remove-all-files', { enabled: true });
  appMenu.updateMenuItem('file,copy-svg-sprite-sheet', { enabled: true });
  appMenu.updateMenuItem('file,save-sprite-sheet', { enabled: true });
});

ipcMain.on('menu:disable-file-items', function () {
  appMenu.updateMenuItem('file,remove-all-files', { enabled: false });
  appMenu.updateMenuItem('file,copy-svg-sprite-sheet', { enabled: false });
  appMenu.updateMenuItem('file,save-sprite-sheet', { enabled: false });
});

ipcMain.on('menu:enable-focused-file-items', function () {
  appMenu.updateMenuItem('edit,reveal-in-finder', { enabled: true });
  appMenu.updateMenuItem('edit,copy-svg', { enabled: true });
  appMenu.updateMenuItem('edit,copy-svg-use', { enabled: true });
  appMenu.updateMenuItem('edit,copy-svg-symbol', { enabled: true });
  appMenu.updateMenuItem('edit,copy-svg-datauri', { enabled: true });
  appMenu.updateMenuItem('edit,remove-file', { enabled: true });
});

ipcMain.on('menu:disable-focused-file-items', function () {
  appMenu.updateMenuItem('edit,reveal-in-finder', { enabled: false });
  appMenu.updateMenuItem('edit,revert-to-original', { enabled: false });
  appMenu.updateMenuItem('edit,re-optimize', { enabled: false });
  appMenu.updateMenuItem('edit,copy-svg', { enabled: false });
  appMenu.updateMenuItem('edit,copy-svg-use', { enabled: false });
  appMenu.updateMenuItem('edit,copy-svg-symbol', { enabled: false });
  appMenu.updateMenuItem('edit,copy-svg-datauri', { enabled: false });
  appMenu.updateMenuItem('edit,remove-file', { enabled: false });
});

ipcMain.on('menu:enable-revert-to-original', function () {
  appMenu.updateMenuItem('edit,revert-to-original', { enabled: true });
  appMenu.updateMenuItem('edit,re-optimize', { enabled: false });
});

ipcMain.on('menu:enable-re-optimize', function () {
  appMenu.updateMenuItem('edit,revert-to-original', { enabled: false });
  appMenu.updateMenuItem('edit,re-optimize', { enabled: true });
});

ipcMain.on('menu:disable-undo-actions', function () {
  appMenu.updateMenuItem('edit,revert-to-original', { enabled: false });
  appMenu.updateMenuItem('edit,re-optimize', { enabled: false });
});

ipcMain.on('menu:disabled-save-sprite-sheet', function () {
  appMenu.updateMenuItem('file,save-sprite-sheet', {
    enabled: false,
  });
});
