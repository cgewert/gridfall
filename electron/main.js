const { app, BrowserWindow, Menu } = require('electron')

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
    //icon:'./assets/icons/win/gridfall' TODO: Linux needs the app icon to be loaded here
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  if (app.isPackaged) {
  const indexPath = path.join(process.resourcesPath, "dist", "index.html");
  mainWindow.loadFile(indexPath)
  } else {
    mainWindow.loadURL('http://localhost:3000')
  }

  const template = [
    {
      label: "Gridfall",
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

