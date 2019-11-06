const { app, BrowserWindow } = require("electron");
require('./index.js')

let mainWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        height: 880,
        width: 540
    });
    mainWindow.loadURL("http://localhost:8000");
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
};

app.on("ready", createWindow);
app.on("activate", () => mainWindow === null && createWindow());
app.on( "window-all-closed", () => {
    process.platform !== "darwin" && app.quit()
});