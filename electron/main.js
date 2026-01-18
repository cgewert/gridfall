const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
  })

  win.loadFile('../dist/index.html')
}

// Disabling the default menu
//app.applicationMenu = null; // HINT: Also disables F11 Fullscreen toggle

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.whenReady().then(() => {
  createWindow();
});

