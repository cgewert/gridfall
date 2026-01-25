const { app, BrowserWindow, Menu, dialog } = require('electron')
const path = require('path');
const fs = require('fs');


let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    show: false,
    backgroundColor: '#000000',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'assets', 'icons', process.platform === 'win32' ? 'win' : 'png', process.platform === 'win32' ? 'icon.ico' : 'icon.png')
    })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

   if (app.isPackaged) {
    const indexPath = path.join(process.resourcesPath, "dist", "index.html");

    if (!fs.existsSync(indexPath)) {
      dialog.showErrorBox(
        "Gridfall - Missing files",
        `Could not find:\n${indexPath}\n\n` +
        `This usually means the dist folder wasn't bundled into the build.\n` +
        `Rebuild with your build:prod step and ensure dist is copied to resources.`
      );
      app.quit();
      return;
    }

    mainWindow.loadFile(indexPath).catch((err) => {
      dialog.showErrorBox(
        "Gridfall - Failed to load UI",
        `Failed to load:\n${indexPath}\n\n${String(err)}`
      );
      app.quit();
    });
  } else {
    mainWindow.loadURL('http://localhost:9000').catch((err) => {
      dialog.showErrorBox("Gridfall - Dev server error", String(err));
      app.quit();
    });
  }

  const versionLabel = `Gridfall v${app.getVersion()}`;
  const template = [
    {
      label: versionLabel,
      submenu: [
        {
          label: "Toggle Fullscreen",
          accelerator: process.platform === "darwin" ? "Ctrl+Command+F" : "F11",
          click: () => {
            if (!mainWindow) return;
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          },
        },
        { type: "separator" },
        {
          label: "Exit",
          accelerator: process.platform === "darwin" ? "Command+Q" : "Alt+F4",
          click: () => app.quit(),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.whenReady().then(() => {
  createWindow();
});

