const { app, Menu, BrowserWindow } = require("electron");
const dotenv = require('dotenv')
dotenv.config()
const port = process.env.PORT || 21129

require('./index.js')

let mainWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        height: 920,
        width: 540,
        title: "Prefabulator"
    });
    mainWindow.loadURL("http://localhost:"+ port);
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
};

Menu.setApplicationMenu(null)
app.on("ready", createWindow);
app.on("activate", () => mainWindow === null && createWindow());
app.on( "window-all-closed", () => {
    process.platform !== "darwin" && app.quit()
});