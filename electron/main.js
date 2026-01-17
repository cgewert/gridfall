const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
  })

  win.loadFile('../dist/index.html')
}

app.whenReady().then(() => {
  createWindow();
});
