# Installation

## Download

Download the latest version from [GitHub Releases](https://github.com/zeroshotlog/portman/releases).

## Install

1. Open the downloaded `.dmg` file
2. Drag `Portman.app` to your Applications folder
3. Eject the DMG

## First Launch

Since Portman is distributed without an Apple Developer signature, macOS Gatekeeper will show a warning on first launch.

### Method 1: Right-click Open

1. Open Finder and navigate to Applications
2. Right-click (or Control-click) on `Portman.app`
3. Select **Open** from the context menu
4. Click **Open** in the security dialog

### Method 2: Remove quarantine attribute (recommended for "damaged" error)

If macOS shows **"Portman is damaged and can't be opened"** (common when downloaded via Chrome/Safari), run:

```bash
xattr -cr /Applications/Portman.app
```

Then open Portman normally.

### Method 3: System Settings

1. Try to open Portman normally (it will be blocked)
2. Go to **System Settings** > **Privacy & Security**
3. Scroll down to find the message about Portman
4. Click **Open Anyway**

## Verify Download (Optional)

To verify your download hasn't been tampered with:

```bash
shasum -a 256 Portman_X.X.X_aarch64.dmg
```

Compare the output with the SHA256 hash listed on the release page.

## Uninstall

To remove Portman:

1. Quit Portman if running
2. Delete `Portman.app` from Applications
3. (Optional) Remove data: `rm -rf ~/.local/share/portman`
