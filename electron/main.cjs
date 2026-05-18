const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  nativeImage,
  screen,
  dialog,
} = require('electron');
const path = require('path');
const fs = require('fs');
const {
  shouldHideWindowAfterSave,
  shouldBlockWindowClose,
  shouldShowWindowOnLaunch,
} = require('./session.cjs');

const isDev = process.env.NODE_ENV === 'development';
let mainWindow = null;
let tray = null;
let timerHandle = null;
let dataPath = '';

const DEFAULT_DATA = {
  cards: [],
  settings: {
    timerEnabled: true,
    timerIntervalMinutes: 30,
    timerCardCount: 5,
    learningStepsMinutes: [1, 10],
    graduatingIntervalDays: 1,
    easyIntervalDays: 4,
  },
  session: {
    mandatoryActive: false,
    mandatoryRemaining: 0,
    lastTimerFired: null,
  },
};

function loadData() {
  try {
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_DATA,
        ...parsed,
        settings: { ...DEFAULT_DATA.settings, ...parsed.settings },
        session: { ...DEFAULT_DATA.session, ...parsed.session },
      };
    }
  } catch (e) {
    console.error('Failed to load data', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 420,
    height: 520,
    x: width - 440,
    y: height - 540,
    frame: false,
    transparent: true,
    alwaysOnTop: false,
    resizable: true,
    skipTaskbar: false,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.platform === 'win32') {
    try {
      mainWindow.setBackgroundMaterial('acrylic');
    } catch (_) {
      /* older Electron */
    }
  }

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    const data = loadData();
    if (shouldShowWindowOnLaunch(data.session)) {
      mainWindow.show();
    }
  });

  mainWindow.on('close', (e) => {
    const data = loadData();
    if (shouldBlockWindowClose(data.session)) {
      e.preventDefault();
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('mandatory-blocked');
    }
  });
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('Flashcard Overlay');
  tray.setContextMenu(
    require('electron').Menu.buildFromTemplate([
      {
        label: 'Show',
        click: () => showStudyWindow(),
      },
      {
        label: 'Study now',
        click: () => triggerMandatorySession(),
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          const data = loadData();
          data.session.mandatoryActive = false;
          data.session.mandatoryRemaining = 0;
          saveData(data);
          app.quit();
        },
      },
    ])
  );
  tray.on('double-click', () => showStudyWindow());
}

function resetTimer() {
  if (timerHandle) clearInterval(timerHandle);
  const data = loadData();
  if (!data.settings.timerEnabled) return;

  const ms = data.settings.timerIntervalMinutes * 60 * 1000;
  timerHandle = setInterval(() => triggerMandatorySession(), ms);
}

function showStudyWindow() {
  if (!mainWindow) return;
  mainWindow.show();
  mainWindow.focus();
}

function hideStudyWindow() {
  mainWindow?.hide();
}

function triggerMandatorySession() {
  const data = loadData();
  data.session.mandatoryActive = true;
  data.session.mandatoryRemaining = data.settings.timerCardCount;
  data.session.lastTimerFired = Date.now();
  saveData(data);

  if (mainWindow) {
    showStudyWindow();
    mainWindow.webContents.send('timer-fired', {
      remaining: data.session.mandatoryRemaining,
    });
  }
}

function registerIpc() {
  ipcMain.handle('get-data', () => loadData());

  ipcMain.handle('save-data', (_, payload) => {
    const prev = loadData();
    saveData(payload);
    resetTimer();
    if (shouldHideWindowAfterSave(prev.session, payload.session)) {
      hideStudyWindow();
    }
    return true;
  });

  ipcMain.handle('pick-csv', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    return fs.readFileSync(result.filePaths[0], 'utf8');
  });

  ipcMain.handle('minimize-window', () => mainWindow?.minimize());
  ipcMain.handle('close-window', () => {
    const data = loadData();
    if (shouldBlockWindowClose(data.session)) {
      return { blocked: true };
    }
    hideStudyWindow();
    return { blocked: false };
  });
}

app.whenReady().then(() => {
  dataPath = path.join(app.getPath('userData'), 'flashcards.json');
  registerIpc();
  createWindow();
  createTray();
  resetTimer();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else showStudyWindow();
  });
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.on('before-quit', () => {
  if (timerHandle) clearInterval(timerHandle);
});
