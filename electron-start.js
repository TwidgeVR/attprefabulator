const { app, BrowserWindow } = require("electron");
require('./index.js')

let mainWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        height: 800,
        width: 520
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