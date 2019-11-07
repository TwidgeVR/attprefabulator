const { app, BrowserWindow } = require("electron");
const dotenv = require('dotenv')
dotenv.config()
const port = process.env.PORT || 21129

require('./index.js')

let mainWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        height: 880,
        width: 540
    });
    mainWindow.loadURL("http://localhost:"+ port);
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
};

app.on("ready", createWindow);
app.on("activate", () => mainWindow === null && createWindow());
app.on( "window-all-closed", () => {
    process.platform !== "darwin" && app.quit()
});