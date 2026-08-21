#!/usr/bin/gjs

imports.gi.versions.Gtk = '4.0';
const { Gtk, Gio, GObject, GLib, Gdk, GdkPixbuf, Adw } = imports.gi;

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<path d="M157.57 101.43C163.47 100.28 176.05 102.34 182.14 103.76C211.25 110.52 236.17 130.45 247.76 158.34C250.58 165.12 252.81 172.5 253.84 179.78C254.48 184.31 254.04 189.45 255.16 193.81C261.49 194.92 268.72 194.04 275.17 194.04C288.26 194.04 301.36 194.04 314.45 194.04C356.52 194.04 398.62 193.64 440.69 194.05C449.48 194.13 458.25 196.03 466.39 199.19C469.86 200.53 474.59 204.45 478.03 204.59C480.16 207.21 483.86 208.62 486.39 210.99C492.79 216.96 498.53 223.44 502.81 231.05C505.9 236.53 508.25 242.55 509.97 248.5C510.76 251.22 510.21 255.9 511.92 258.15C511.92 321.4 511.92 384.64 511.92 447.89C510.69 449.53 511.42 451.48 510.94 453.33C510.01 456.96 509.09 460.54 507.84 464.07C504.28 474.13 498.17 483.19 490.65 490.9C482.63 499.12 471.74 505.98 460.8 509.06C458.34 509.75 449.39 510.76 447.9 511.92C344.09 511.92 240.27 511.92 136.46 511.92C133.94 510.34 129.76 510.59 126.84 509.83C123.63 509 120.36 507.94 117.29 506.67C101.55 500.14 88 487.98 80.2 472.74C71.95 456.6 72.1 439.74 72.1 421.99C72.1 410.61 72.1 399.24 72.1 387.86C72.1 337.36 72.1 286.86 72.1 236.36C72.1 204.96 68.77 174.42 85.35 146.36C95.75 128.77 113.3 113.87 132.64 107.2C138.75 105.09 145.57 104.21 151.41 102.03C153.38 101.3 155.85 102.6 157.57 101.43Z" fill="#7da5ff" fill-rule="evenodd" stroke="#7da5ff" stroke-width="0.25" stroke-linejoin="round"/>
<path d="M477.37 93.05C477.45 96.03 477.7 98.5 478.25 101.23C479.5 107.46 478.28 116.67 478.28 123.21C478.28 138.95 478.28 154.69 478.28 170.43C478.28 178.38 478.28 186.33 478.28 194.28C478.28 197.51 478.87 201.55 478.03 204.59C474.59 204.45 469.86 200.53 466.39 199.19C458.25 196.03 449.48 194.13 440.69 194.05C398.62 193.64 356.52 194.04 314.45 194.04C301.36 194.04 288.26 194.04 275.17 194.04C268.72 194.04 261.49 194.92 255.16 193.81C254.04 189.45 254.48 184.31 253.84 179.78C252.81 172.5 250.58 165.12 247.76 158.34C236.17 130.45 211.25 110.52 182.14 103.76C176.05 102.34 163.47 100.28 157.57 101.43C129.21 103.36 97.59 97.45 69.9 104.19C61.33 106.28 52.99 109.9 45.36 114.34C41.09 116.82 37.28 120.83 32.92 122.94C32.25 119.17 32.02 102.54 32.79 98.89C33.11 97.4 33.68 96.62 33.64 94.92C34.65 94.26 38.78 82.02 40.34 79.38C46.82 68.45 57.65 59.62 69.96 56.23C81.78 52.97 94.69 54.18 106.84 54.18C127.26 54.18 147.68 54.18 168.09 54.18C230.91 54.18 293.72 54.18 356.53 54.18C374.3 54.18 392.07 54.18 409.83 54.18C427.8 54.18 445.18 53.92 459.58 66.21C465.67 71.42 470.78 78.28 473.76 85.73C474.95 88.71 475.14 92.72 476.7 95.39C476.92 94.61 477.15 93.83 477.37 93.05Z" fill="#c0bec0" fill-rule="evenodd" stroke="#c0bec0" stroke-width="0.25" stroke-linejoin="round"/>
<path d="M157.57 101.43C155.85 102.6 153.38 101.3 151.41 102.03C145.57 104.21 138.75 105.09 132.64 107.2C113.3 113.87 95.75 128.77 85.35 146.36C68.77 174.42 72.1 204.96 72.1 236.36C72.1 286.86 72.1 337.36 72.1 387.86C72.1 399.24 72.1 410.61 72.1 421.99C72.1 439.74 71.95 456.6 80.2 472.74C88 487.98 101.55 500.14 117.29 506.67C120.36 507.94 123.63 509 126.84 509.83C129.76 510.59 133.94 510.34 136.46 511.92C112.02 511.92 87.58 511.92 63.13 511.92C61.68 510.57 59.95 511.29 58.21 510.89C54.62 510.05 51 509.01 47.52 507.78C37.92 504.38 28.54 498.28 21.34 490.92C13.94 483.34 7.73 474.38 4.21 464.48C2.98 461 1.92 457.39 1.11 453.79C0.71 452.04 1.4 450.39 0.08 448.89C0.08 360.37 0.08 271.84 0.08 183.31C1.88 181.39 1.47 175.86 2.08 173.22C3.28 167.96 5.05 162.45 7.25 157.53C11.14 148.85 16.37 139.78 23.03 132.65C26.12 129.35 30.16 126.46 32.92 122.94C37.28 120.83 41.09 116.82 45.36 114.34C52.99 109.9 61.33 106.28 69.9 104.19C97.59 97.45 129.21 103.36 157.57 101.43Z" fill="#126fc8" fill-rule="evenodd" stroke="#126fc8" stroke-width="0.25" stroke-linejoin="round"/>
<path d="M77.19 0.08C196.07 0.08 314.95 0.08 433.83 0.08C435.57 1.68 439.76 1.2 442.09 2.1C447.23 4.07 453.07 6.32 457.39 9.97C467.12 18.21 475.74 29.89 477.12 42.78C478.03 51.23 477.54 60 477.54 68.5C477.54 76.45 478.55 85.2 477.37 93.05C477.15 93.83 476.92 94.61 476.7 95.39C475.14 92.72 474.95 88.71 473.76 85.73C470.78 78.28 465.67 71.42 459.58 66.21C445.18 53.92 427.8 54.18 409.83 54.18C392.07 54.18 374.3 54.18 356.53 54.18C293.72 54.18 230.91 54.18 168.09 54.18C147.68 54.18 127.26 54.18 106.84 54.18C94.69 54.18 81.78 52.97 69.96 56.23C57.65 59.62 46.82 68.45 40.34 79.38C38.78 82.02 34.65 94.26 33.64 94.92C32.06 88.36 33.36 78.28 33.36 71.31C33.36 50.46 31.75 29.52 48.66 14.29C53.92 9.55 59.7 5.66 66.17 3.06C68.81 2 75.44 1.58 77.19 0.08Z" fill="#8b8b8b" fill-rule="evenodd" stroke="#8b8b8b" stroke-width="0.25" stroke-linejoin="round"/>
</svg>`;

const createLogoImage = (pixelSize) => {
    const bytes = GLib.Bytes.new(imports.byteArray.fromString(logoSvg));
    const stream = Gio.MemoryInputStream.new_from_bytes(bytes);
    const pixbuf = GdkPixbuf.Pixbuf.new_from_stream(stream, null);
    const image = Gtk.Image.new_from_pixbuf(pixbuf);
    image.set_pixel_size(pixelSize);
    return image;
};

const FileItem = GObject.registerClass({
    Properties: {
        'info': GObject.ParamSpec.object('info', 'Info', 'File Info', GObject.ParamFlags.READWRITE, Gio.FileInfo),
        'file': GObject.ParamSpec.object('file', 'File', 'Gio File', GObject.ParamFlags.READWRITE, Gio.File)
    }
}, class FileItem extends GObject.Object {});

const App = GObject.registerClass(
class App extends Gtk.Application {
    _init() {
        super._init({ application_id: 'org.iui.Explorer' });
    }

    vfunc_activate() {
        const cssProvider = new Gtk.CssProvider();
        const cssString = `
            tabbar tab {
                min-height: 32px;
                border-radius: 6px;
                margin: 4px 2px;
            }
            
            tabbar tab:checked {
                background-color: rgba(130, 130, 130, 0.25); 
            }
            tabbar tab:hover:not(:checked) {
                background-color: rgba(130, 130, 130, 0.1);
            }
            
            tabbar tab button.close {
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            
            tabbar tab:hover button.close {
                opacity: 1;
            }
            
            scrolledwindow.breadcrumb-bar {
                background-color: #E6E6E6;
                border-radius: 6px;
                padding: 2px;

            }
            
            scrolledwindow.breadcrumb-bar button {
                background: transparent;
                border: none;
                box-shadow: none;
                border-radius: 4px;
                margin: 0 1px;
            }

            scrolledwindow.breadcrumb-bar button:hover {
                background-color: rgba(120, 120, 120, 0.15);
            }
        `;
        cssProvider.load_from_data(cssString);
        Gtk.StyleContext.add_provider_for_display(
            Gdk.Display.get_default(),
            cssProvider,
            Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        );
        
        Adw.init();

        const window = new Gtk.ApplicationWindow({
            application: this,
            default_width: 1200,
            default_height: 800
        });

        // Fenêtre principale et onglets.
        const tabView = new Adw.TabView();
        
        const tabBar = new Adw.TabBar({ 
            view: tabView,
            autohide: false,
            hexpand: true,
            expand_tabs: false
        });
        
        tabBar.add_css_class('inline'); 

        const btnNewTab = new Gtk.Button({ 
            icon_name: 'list-add-symbolic',
            valign: Gtk.Align.CENTER
        });
        btnNewTab.add_css_class('flat');
        tabBar.set_end_action_widget(btnNewTab);

        const titlebarBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
        titlebarBox.add_css_class('titlebar');

        const controlsStart = new Gtk.WindowControls({ side: Gtk.PackType.START });
        const controlsEnd = new Gtk.WindowControls({ 
            side: Gtk.PackType.END,
            margin_end: 12
        });

        titlebarBox.append(controlsStart);
        titlebarBox.append(tabBar); 
        titlebarBox.append(controlsEnd);

        const windowHandle = new Gtk.WindowHandle();
        windowHandle.set_child(titlebarBox);

        window.set_titlebar(windowHandle);
        window.set_child(tabView);

        let aboutWindow = null;
        const showAboutWindow = () => {
            if (aboutWindow) {
                aboutWindow.present();
                return;
            }

            aboutWindow = new Gtk.Window({
                transient_for: window,
                modal: false,
                title: 'À propos de Velora Explorer',
                default_width: 420,
                resizable: false,
                destroy_with_parent: true
            });

            const box = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
                spacing: 12,
                margin_top: 24,
                margin_bottom: 24,
                margin_start: 24,
                margin_end: 24
            });
            aboutWindow.set_child(box);

            const icon = createLogoImage(64);
            icon.set_halign(Gtk.Align.CENTER);
            box.append(icon);

            const title = new Gtk.Label({ label: 'Velora Explorer', halign: Gtk.Align.CENTER });
            title.add_css_class('title-1');
            box.append(title);

            const version = new Gtk.Label({ label: 'Version 0.1.0', halign: Gtk.Align.CENTER });
            version.add_css_class('dim-label');
            box.append(version);

            const info = new Gtk.Label({ label: 'Developpé par PRISM pour IUI', halign: Gtk.Align.CENTER });
            info.add_css_class('dim-label');
            box.append(info);

            const description = new Gtk.Label({
                label: 'Un explorateur de fichiers GTK4.',
                wrap: true,
                justify: Gtk.Justification.CENTER,
                halign: Gtk.Align.CENTER
            });
            box.append(description);

            const closeButton = new Gtk.Button({ label: 'Fermer', halign: Gtk.Align.CENTER });
            closeButton.connect('clicked', () => aboutWindow.close());
            box.append(closeButton);

            aboutWindow.connect('close-request', () => {
                aboutWindow = null;
                return false;
            });
            aboutWindow.present();
        };

        const aboutAction = new Gio.SimpleAction({ name: 'about' });
        aboutAction.connect('activate', showAboutWindow);
        window.add_action(aboutAction);
        
        const tabRegistry = [];

        tabView.connect('close-page', (view, page) => {
            const recordIndex = tabRegistry.findIndex(r => r.page === page);
            if (recordIndex !== -1) {
                tabRegistry[recordIndex].context.cleanup();
                tabRegistry.splice(recordIndex, 1);
            }

            view.close_page_finish(page, true); 
            
            if (view.get_n_pages() === 0) {
                window.close();
            }
            return true;
        });

        window.connect('close-request', () => {
            if (tabRegistry.length > 0) {
                window.set_focus(null);

                tabRegistry.forEach(record => record.context.cleanup());
                tabRegistry.length = 0;
                
                GLib.idle_add(GLib.PRIORITY_HIGH, () => {
                    window.close();
                    return GLib.SOURCE_REMOVE;
                });
                
                return true;
            }
            return false;
        });

        btnNewTab.connect('clicked', () => {
            createNewTab(GLib.get_home_dir());
        });

        this.clipboard = { action: null, files: [] };

        // Opérations fichiers asynchrones.
        const FileOps = {
            _showProgress: (title, fileName, hasProgress, operationCallback) => {
                const cancellable = new Gio.Cancellable();

                const progWin = new Gtk.Window({
                    transient_for: window,
                    modal: false,
                    title: title,
                    default_width: 350,
                    resizable: false
                });

                const box = new Gtk.Box({ 
                    orientation: Gtk.Orientation.VERTICAL, 
                    spacing: 12, margin_top: 20, margin_bottom: 20, margin_start: 20, margin_end: 20 
                });
                progWin.set_child(box);

                const label = new Gtk.Label({ label: `Préparation de : ${fileName}...`, xalign: 0 });
                box.append(label);

                const progressBar = new Gtk.ProgressBar();
                box.append(progressBar);

                const cancelBtn = new Gtk.Button({ label: "Annuler", halign: Gtk.Align.END });
                cancelBtn.connect('clicked', () => {
                    cancellable.cancel();
                    cancelBtn.set_sensitive(false);
                    label.set_text("Annulation en cours...");
                });
                box.append(cancelBtn);

                progWin.present();

                let pulseId = 0;
                if (!hasProgress) {
                    pulseId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
                        progressBar.pulse();
                        return GLib.SOURCE_CONTINUE;
                    });
                }

                GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
                    if (cancellable.is_cancelled()) {
                        if (pulseId) GLib.Source.remove(pulseId);
                        progWin.close();
                        return GLib.SOURCE_REMOVE;
                    }

                    const updateLabel = (text) => label.set_text(text);

                    operationCallback(
                        cancellable,
                        (current, total) => {
                            if (total > 0) progressBar.set_fraction(current / total);
                        },
                        () => {
                            if (pulseId) GLib.Source.remove(pulseId);
                            progWin.close();
                        },
                        updateLabel
                    );
                    return GLib.SOURCE_REMOVE;
                });
            },

            mkdir: (parentDir, name, onSuccess, onError) => {
                const newDir = parentDir.get_child(name);
                newDir.make_directory_async(GLib.PRIORITY_DEFAULT, null, (source, res) => {
                    try {
                        source.make_directory_finish(res);
                        if (onSuccess) onSuccess();
                    } catch (e) {
                        if (onError) onError(e);
                    }
                });
            },

            mkfile: (parentDir, name, onSuccess, onError) => {
                const newFile = parentDir.get_child(name);
                newFile.create_async(Gio.FileCreateFlags.NONE, GLib.PRIORITY_DEFAULT, null, (source, res) => {
                    try {
                        const outputStream = source.create_finish(res);
                        outputStream.close_async(GLib.PRIORITY_DEFAULT, null, () => {
                            if (onSuccess) onSuccess();
                        });
                    } catch (e) {
                        if (onError) onError(e);
                    }
                });
            },
            

            rename: (file, newName, onSuccess, onError) => {
                file.set_display_name_async(newName, GLib.PRIORITY_DEFAULT, null, (source, res) => {
                    try {
                        const newFile = source.set_display_name_finish(res);
                        if (onSuccess) onSuccess(newFile);
                    } catch (e) {
                        if (onError) onError(e);
                    }
                });
            },

            copy: (sources, destDir, onSuccess, onError) => {
                const srcArray = Array.isArray(sources) ? sources : [sources];
                if (srcArray.length === 0) {
                    if (onSuccess) onSuccess();
                    return;
                }

                FileOps._showProgress("Copie en cours", "Préparation...", false, (cancellable, progressCb, closeWin, updateLabel) => {
                    let currentIndex = 0;

                    const processNextRoot = () => {
                        if (cancellable.is_cancelled() || currentIndex >= srcArray.length) {
                            closeWin();
                            if (onSuccess && currentIndex >= srcArray.length) onSuccess();
                            return;
                        }

                        const src = srcArray[currentIndex];
                        const dst = destDir.get_child(src.get_basename());

                        const copyRecursive = (currentSrc, currentDst, cb) => {
                            if (cancellable.is_cancelled()) { cb(new Error("Annulé")); return; }
                            
                            updateLabel(`Copie : ${currentSrc.get_basename()}`);

                            currentSrc.query_info_async('standard::type', Gio.FileQueryInfoFlags.NONE, GLib.PRIORITY_DEFAULT, cancellable, (s, res) => {
                                try {
                                    const info = s.query_info_finish(res);
                                    
                                    if (info.get_file_type() === Gio.FileType.DIRECTORY) {
                                        currentDst.make_directory_async(GLib.PRIORITY_DEFAULT, cancellable, (d, makeRes) => {
                                            try { d.make_directory_finish(makeRes); } catch(e) {} 
                                            
                                            currentSrc.enumerate_children_async('standard::name', Gio.FileQueryInfoFlags.NONE, GLib.PRIORITY_DEFAULT, cancellable, (enumSrc, enumRes) => {
                                                let enumerator;
                                                try { enumerator = enumSrc.enumerate_children_finish(enumRes); } catch(e) { cb(e); return; }
                                                
                                                const processNextChild = () => {
                                                    if (cancellable.is_cancelled()) { cb(new Error("Annulé")); return; }
                                                    enumerator.next_files_async(1, GLib.PRIORITY_DEFAULT, cancellable, (enumObj, filesRes) => {
                                                        let files;
                                                        try { files = enumObj.next_files_finish(filesRes); } catch(e) { cb(e); return; }
                                                        
                                                        if (files.length > 0) {
                                                            const childName = files[0].get_name();
                                                            copyRecursive(currentSrc.get_child(childName), currentDst.get_child(childName), (err) => {
                                                                if (err) cb(err); else processNextChild();
                                                            });
                                                        } else {
                                                            cb(); 
                                                        }
                                                    });
                                                };
                                                processNextChild();
                                            });
                                        });
                                    } else {
                                        currentSrc.copy_async(currentDst, Gio.FileCopyFlags.NONE, GLib.PRIORITY_DEFAULT, cancellable, null, (cSrc, cRes) => {
                                            try { cSrc.copy_finish(cRes); cb(); } catch(e) { cb(e); }
                                        });
                                    }
                                } catch(e) { cb(e); }
                            });
                        };

                        copyRecursive(src, dst, (err) => {
                            currentIndex++;
                            processNextRoot();
                        });
                    };

                    processNextRoot();
                });
            },

            move: (sources, destDir, onSuccess, onError) => {
                const srcArray = Array.isArray(sources) ? sources : [sources];
                if (srcArray.length === 0) { if (onSuccess) onSuccess(); return; }

                FileOps._showProgress("Déplacement en cours", "Préparation...", true, (cancellable, progressCb, closeWin, updateLabel) => {
                    let currentIndex = 0;
                    
                    const processNext = () => {
                        if (cancellable.is_cancelled() || currentIndex >= srcArray.length) {
                            closeWin();
                            if (onSuccess && currentIndex >= srcArray.length) onSuccess();
                            return;
                        }

                        const src = srcArray[currentIndex];
                        const dst = destDir.get_child(src.get_basename());
                        
                        updateLabel(`Déplacement : ${src.get_basename()} (${currentIndex + 1}/${srcArray.length})`);
                        progressCb(currentIndex, srcArray.length);
                        
                        src.move_async(dst, Gio.FileCopyFlags.NONE, GLib.PRIORITY_DEFAULT, cancellable, null, (s, res) => {
                            try { s.move_finish(res); } catch(e) { console.warn(e.message); }
                            currentIndex++;
                            progressCb(currentIndex, srcArray.length);
                            processNext();
                        });
                    };
                    processNext();
                });
            },

            trash: (files, onSuccess, onError) => {
                const fileArray = Array.isArray(files) ? files : [files];
                const total = fileArray.length;
                
                if (total === 0) {
                    if (onSuccess) onSuccess();
                    return;
                }

                FileOps._showProgress("Mise à la corbeille", fileArray[0].get_basename(), true, (cancellable, progressCb, closeWin, updateLabel) => {
                    let currentIndex = 0;

                    const trashNext = () => {
                        if (cancellable.is_cancelled()) {
                            closeWin();
                            console.log("Suppression annulée par l'utilisateur.");
                            return;
                        }

                        if (currentIndex >= total) {
                            closeWin();
                            if (onSuccess) onSuccess();
                            return;
                        }

                        const currentFile = fileArray[currentIndex];
                        
                        updateLabel(`Suppression de : ${currentFile.get_basename()} (${currentIndex + 1}/${total})`);
                        
                        progressCb(currentIndex, total);

                        currentFile.trash_async(GLib.PRIORITY_DEFAULT, cancellable, (source, res) => {
                            try {
                                source.trash_finish(res);
                            } catch (e) {
                                console.warn(`Erreur sur ${currentFile.get_basename()}: ${e.message}`);
                            }
                            
                            currentIndex++;
                            progressCb(currentIndex, total);
                            trashNext();
                        });
                    };

                    trashNext();
                });
            }
        };

        const getActiveTab = () => {
            const activePage = tabView.get_selected_page();
            const record = tabRegistry.find(r => r.page === activePage);
            return record ? record.context : null;
        };

        const openAction = new Gio.SimpleAction({ name: 'open' });
        openAction.connect('activate', () => {
            const tab = getActiveTab();
            if (tab) tab.openSelected();
        });
        window.add_action(openAction);

        const openWithAction = new Gio.SimpleAction({ name: 'open-with' });
        openWithAction.connect('activate', () => {
            const tab = getActiveTab();
            if (tab) tab.openWithSelected();
        });
        window.add_action(openWithAction);

        const propertiesAction = new Gio.SimpleAction({ name: 'properties' });
        propertiesAction.connect('activate', () => {
            const tab = getActiveTab();
            if (!tab) return;
            const selectedFiles = tab.getSelectedFiles();
            if (selectedFiles.length === 1) tab.openPropertiesWindow(selectedFiles[0]); 
        });
        window.add_action(propertiesAction);

        const copyAction = new Gio.SimpleAction({ name: 'copy' });
        copyAction.connect('activate', () => {
            const tab = getActiveTab();
            if (!tab) return;
            const selectedFiles = tab.getSelectedFiles();
            if (selectedFiles.length > 0) {
                this.clipboard.action = 'copy';
                this.clipboard.files = selectedFiles.map(item => item.file);
            }
        });
        window.add_action(copyAction);

        const cutAction = new Gio.SimpleAction({ name: 'cut' });
        cutAction.connect('activate', () => {
            const tab = getActiveTab();
            if (!tab) return;
            const selectedFiles = tab.getSelectedFiles();
            if (selectedFiles.length > 0) {
                this.clipboard.action = 'cut';
                this.clipboard.files = selectedFiles.map(item => item.file);
            }
        });
        window.add_action(cutAction);

        const pasteAction = new Gio.SimpleAction({ name: 'paste' });
        pasteAction.connect('activate', () => {
            const tab = getActiveTab();
            if (!tab || !tab.currentDir || !this.clipboard.files || this.clipboard.files.length === 0) return;
            
            const onSuccess = () => {
                tab.loadDirectory(tab.currentDir.get_path(), false);
                if (this.clipboard.action === 'cut') this.clipboard = { action: null, files: [] };
            };
            const onError = (err) => console.error(err.message);

            if (this.clipboard.action === 'copy') {
                FileOps.copy(this.clipboard.files, tab.currentDir, onSuccess, onError);
            } else if (this.clipboard.action === 'cut') {
                FileOps.move(this.clipboard.files, tab.currentDir, onSuccess, onError);
            }
        });
        window.add_action(pasteAction);

        const deleteAction = new Gio.SimpleAction({ name: 'delete' });
        deleteAction.connect('activate', () => {
            const tab = getActiveTab();
            if (!tab) return;
            const selectedFiles = tab.getSelectedFiles();
            if (selectedFiles.length > 0) {
                FileOps.trash(selectedFiles.map(item => item.file), () => tab.loadDirectory(tab.currentDir.get_path(), false));
            }
        });
        window.add_action(deleteAction);

        const newFolderAction = new Gio.SimpleAction({ name: 'new-folder' });
        newFolderAction.connect('activate', () => {
            const tab = getActiveTab();
            if (!tab || !tab.currentDir) return;
            tab.promptNewName("Nouveau dossier", "Nouveau dossier", (name) => {
                FileOps.mkdir(tab.currentDir, name, () => tab.loadDirectory(tab.currentDir.get_path(), false));
            });
        });
        window.add_action(newFolderAction);

        const newFileAction = new Gio.SimpleAction({ name: 'new-file' });
        newFileAction.connect('activate', () => {
            const tab = getActiveTab();
            if (!tab || !tab.currentDir) return;
            tab.promptNewName("Nouveau fichier", "Nouveau document.txt", (name) => {
                FileOps.mkfile(tab.currentDir, name, () => tab.loadDirectory(tab.currentDir.get_path(), false));
            });
        });
        window.add_action(newFileAction);

        const renameAction = new Gio.SimpleAction({ name: 'rename' });
        renameAction.connect('activate', () => {
            const tab = getActiveTab();
            if (tab && tab.renameSelected) tab.renameSelected();
        });
        window.add_action(renameAction);

        // Raccourcis clavier globaux.
        this.set_accels_for_action('win.copy', ['<Ctrl>c']);
        this.set_accels_for_action('win.cut', ['<Ctrl>x']);
        this.set_accels_for_action('win.paste', ['<Ctrl>v']);
        this.set_accels_for_action('win.delete', ['Delete']);
        this.set_accels_for_action('win.properties', ['<Alt>Return']);
        this.set_accels_for_action('win.rename', ['F2']);


        const createNewTab = (initialPath) => {
            const tabContent = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
            const page = tabView.append(tabContent);
            page.set_title("Chargement...");
            
            // État propre à l'onglet.
            let currentDir = null;
            let historyBack = [];
            let historyForward = [];
            let navCancellable = new Gio.Cancellable();
            const propertyWindows = new Set();
            const fileStore = new Gio.ListStore({ item_type: FileItem });
            let directoryScanComplete = false;

            // Interface de l'onglet.
            const topBar = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, margin_top: 8, margin_bottom: 8, margin_start: 8, margin_end: 8 });
            tabContent.append(topBar);

            const navGroup = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
            navGroup.add_css_class('linked'); 
            const btnBack = new Gtk.Button({ icon_name: 'go-previous-symbolic' });
            const btnForward = new Gtk.Button({ icon_name: 'go-next-symbolic' });
            btnBack.set_sensitive(false);
            btnForward.set_sensitive(false);
            navGroup.append(btnBack);
            navGroup.append(btnForward);
            topBar.append(navGroup);

            const btnRefresh = new Gtk.Button({ icon_name: 'view-refresh-symbolic' });
            topBar.append(btnRefresh);

            const pathStack = new Gtk.Stack({ transition_type: Gtk.StackTransitionType.CROSSFADE, hexpand: true });
            
            const breadcrumbScroll = new Gtk.ScrolledWindow({ 
                vscrollbar_policy: Gtk.PolicyType.NEVER,
                hscrollbar_policy: Gtk.PolicyType.AUTOMATIC 
            });
            breadcrumbScroll.add_css_class('breadcrumb-bar');

            const breadcrumbBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 0 });
            breadcrumbBox.add_css_class('linked');
            breadcrumbScroll.set_child(breadcrumbBox);
            
            pathStack.add_named(breadcrumbScroll, "breadcrumbs");

            const pathEntry = new Gtk.Entry({ placeholder_text: "Chemin d'accès...", hexpand: true });
            pathStack.add_named(pathEntry, "entry");

            topBar.append(pathStack);

            const togglePathBtn = new Gtk.ToggleButton({ icon_name: 'document-edit-symbolic' });
            togglePathBtn.connect('toggled', () => {
                if (togglePathBtn.get_active()) {
                    pathStack.set_visible_child_name("entry");
                    pathEntry.grab_focus();
                } else {
                    pathStack.set_visible_child_name("breadcrumbs");
                }
            });
            topBar.append(togglePathBtn);

            const btnFavorite = new Gtk.Button({ icon_name: 'starred-symbolic', tooltip_text: 'Ajouter aux favoris' });
            btnFavorite.add_css_class('flat');
            topBar.append(btnFavorite);

            const appMenu = new Gio.Menu();
            appMenu.append('À propos', 'win.about');
            const menuButton = new Gtk.MenuButton({
                icon_name: 'open-menu-symbolic',
                tooltip_text: 'Menu',
                menu_model: appMenu
            });
            menuButton.add_css_class('flat');
            topBar.append(menuButton);

            const searchEntry = new Gtk.SearchEntry({ placeholder_text: "Rechercher...", width_request: 200 });
            topBar.append(searchEntry);

            const updateBreadcrumbs = (path) => {
                let child = breadcrumbBox.get_first_child();
                while (child) {
                    breadcrumbBox.remove(child);
                    child = breadcrumbBox.get_first_child();
                }

                if (path.startsWith('trash://')) {
                    const btn = new Gtk.Button({ label: "Corbeille", icon_name: 'user-trash-symbolic' });
                    btn.connect('clicked', () => loadDirectory('trash:///'));
                    breadcrumbBox.append(btn);
                    return;
                }

                const homeDir = GLib.get_home_dir();
                let parts = [];
                let currentBuiltPath = "";
                let startWithHome = false;

                const addSeparator = () => {
                    const sep = new Gtk.Label({ label: " › ", css_classes: ['dim-label'] });
                    breadcrumbBox.append(sep);
                };

                if (path === homeDir || path.startsWith(homeDir + '/')) {
                    startWithHome = true;
                    currentBuiltPath = homeDir;
                    
                    if (path === homeDir) {
                        const homeBtn = new Gtk.Button();
                        const btnBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 6, margin_start: 4, margin_end: 4 });
                        btnBox.append(new Gtk.Image({ icon_name: 'user-home-symbolic' }));
                        btnBox.append(new Gtk.Label({ label: "Accueil" }));
                        homeBtn.set_child(btnBox);

                        homeBtn.connect('clicked', () => loadDirectory(homeDir));
                        breadcrumbBox.append(homeBtn);
                        return; // On s'arrête là
                    }

                    const homeBtn = new Gtk.Button({ icon_name: 'user-home-symbolic' });
                    homeBtn.connect('clicked', () => loadDirectory(homeDir));
                    breadcrumbBox.append(homeBtn);

                    const relativePath = path.substring(homeDir.length);
                    parts = relativePath.split('/').filter(p => p !== '');
                } else {
                    parts = path.split('/').filter(p => p !== '');
                    
                    const rootBtn = new Gtk.Button({ icon_name: 'drive-harddisk-system-symbolic' });
                    rootBtn.connect('clicked', () => loadDirectory('/'));
                    breadcrumbBox.append(rootBtn);
                }

                if (parts.length > 0) {
                    addSeparator();
                }

                // On déroule les sous-dossiers après la maison
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    
                    currentBuiltPath += '/' + part;
                    const stepPath = currentBuiltPath;
                    
                    const btn = new Gtk.Button({ label: part });
                    btn.connect('clicked', () => loadDirectory(stepPath));
                    breadcrumbBox.append(btn);

                    if (i < parts.length - 1) {
                        addSeparator();
                    }
                }
            };

            const paned = new Gtk.Paned({ vexpand: true }); 
            tabContent.append(paned);

            const leftBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
            paned.set_start_child(leftBox);
            paned.set_position(250);

            const sidebarList = new Gtk.ListBox({ selection_mode: Gtk.SelectionMode.SINGLE });
            sidebarList.add_css_class('navigation-sidebar'); 

            const locationDataFile = Gio.File.new_for_path(
                GLib.build_filenamev([GLib.get_user_config_dir(), 'prism-explorer', 'locations.json'])
            );
            let favoriteLocations = [];
            let recentLocations = [];

            const loadLocationData = () => {
                try {
                    const [, contents] = locationDataFile.load_contents(null);
                    const data = JSON.parse(imports.byteArray.toString(contents));
                    favoriteLocations = Array.isArray(data.favorites) ? data.favorites : [];
                    recentLocations = Array.isArray(data.recent) ? data.recent : [];
                } catch (e) { }
            };

            const saveLocationData = () => {
                try {
                    locationDataFile.get_parent().make_directory_with_parents(null);
                } catch (e) { }
                try {
                    locationDataFile.replace_contents(
                        JSON.stringify({ favorites: favoriteLocations, recent: recentLocations }),
                        null,
                        false,
                        Gio.FileCreateFlags.REPLACE_DESTINATION,
                        null
                    );
                } catch (e) { }
            };

            const clearLocationRows = (list) => {
                let row = list.get_first_child();
                while (row) {
                    const next = row.get_next_sibling();
                    list.remove(row);
                    row = next;
                }
            };

            const createLocationRow = (list, location, canRemove = false) => {
                const row = new Gtk.ListBoxRow();
                row.targetPath = location.path;
                const box = new Gtk.Box({
                    orientation: Gtk.Orientation.HORIZONTAL,
                    spacing: 8,
                    margin_start: 10,
                    margin_end: 6,
                    margin_top: 5,
                    margin_bottom: 5
                });
                box.append(new Gtk.Image({ icon_name: location.icon || 'folder-symbolic' }));
                const label = new Gtk.Label({ label: location.name, xalign: 0, hexpand: true });
                label.set_ellipsize(3);
                box.append(label);
                if (canRemove) {
                    const removeButton = new Gtk.Button({ icon_name: 'window-close-symbolic', tooltip_text: 'Retirer des favoris' });
                    removeButton.add_css_class('flat');
                    removeButton.connect('clicked', () => {
                        favoriteLocations = favoriteLocations.filter(item => item.path !== location.path);
                        saveLocationData();
                        rebuildLocationLists();
                    });
                    box.append(removeButton);
                }
                row.set_child(box);
                list.append(row);
            };

            let locationsList = null;
            let locationsView = null;
            let locationsTitle = null;
            let locationsMode = null;

            const rebuildLocationLists = () => {
                if (!locationsList) return;
                clearLocationRows(locationsList);
                const locations = locationsMode === 'recent' ? recentLocations : favoriteLocations;
                locations.forEach(location => createLocationRow(locationsList, location, locationsMode !== 'recent'));
            };

            const showLocationsView = (mode) => {
                locationsMode = mode;
                rebuildLocationLists();
                locationsTitle.set_text(mode === 'recent' ? 'Emplacements récents' : 'Favoris');
                viewStack.set_visible_child_name('locations');
            };

            const locationsActions = new Gtk.ListBox({ selection_mode: Gtk.SelectionMode.SINGLE });
            locationsActions.add_css_class('navigation-sidebar');
            const createLocationActionRow = (iconName, labelText) => {
                const row = new Gtk.ListBoxRow();
                const content = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, margin_start: 10, margin_end: 10, margin_top: 8, margin_bottom: 8 });
                content.append(new Gtk.Image({ icon_name: iconName }));
                content.append(new Gtk.Label({ label: labelText, xalign: 0 }));
                row.set_child(content);
                return row;
            };
            locationsActions.append(createLocationActionRow('starred-symbolic', 'Favoris'));
            locationsActions.append(createLocationActionRow('document-open-recent-symbolic', 'Emplacements récents'));
            locationsActions.connect('row-activated', (list, row) => {
                showLocationsView(row === list.get_row_at_index(0) ? 'favorites' : 'recent');
                list.unselect_all();
            });
            leftBox.append(locationsActions);
            leftBox.append(new Gtk.Separator({ margin_top: 5, margin_bottom: 5 }));
            leftBox.append(sidebarList);

            const getLocationName = (path) => {
                if (path === 'trash:///') return 'Corbeille';
                return Gio.File.new_for_path(path).get_basename() || path;
            };

            const updateFavoriteButton = () => {
                const path = currentDir && currentDir.get_uri();
                const isFavorite = path && favoriteLocations.some(location => location.path === path);
                btnFavorite.set_icon_name(isFavorite ? 'starred-symbolic' : 'non-starred-symbolic');
                btnFavorite.set_tooltip_text(isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris');
            };

            const toggleCurrentFavorite = () => {
                if (!currentDir) return;
                const path = currentDir.get_uri();
                const existingIndex = favoriteLocations.findIndex(location => location.path === path);
                if (existingIndex >= 0) {
                    favoriteLocations.splice(existingIndex, 1);
                } else {
                    favoriteLocations.unshift({
                        path,
                        name: getLocationName(currentDir.get_path() || path),
                        icon: 'folder-symbolic'
                    });
                }
                saveLocationData();
                rebuildLocationLists();
                updateFavoriteButton();
            };

            const recordRecentLocation = () => {
                if (!currentDir) return;
                const path = currentDir.get_uri();
                recentLocations = recentLocations.filter(location => location.path !== path);
                recentLocations.unshift({
                    path,
                    name: getLocationName(currentDir.get_path() || path),
                    icon: path === 'trash:///' ? 'user-trash-symbolic' : 'folder-symbolic'
                });
                recentLocations = recentLocations.slice(0, 12);
                saveLocationData();
                rebuildLocationLists();
            };

            btnFavorite.connect('clicked', toggleCurrentFavorite);

            loadLocationData();
            rebuildLocationLists();

            const addSidebarItem = (iconName, labelText, targetPath) => {
                if (!targetPath) return;
                const row = new Gtk.ListBoxRow();
                row.targetPath = targetPath;
                const box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, margin_start: 10, margin_end: 10, margin_top: 8, margin_bottom: 8 });
                box.append(new Gtk.Image({ icon_name: iconName }));
                box.append(new Gtk.Label({ label: labelText, xalign: 0 }));
                row.set_child(box);
                sidebarList.append(row);
            };

            addSidebarItem('user-home-symbolic', 'Accueil', GLib.get_home_dir());
            addSidebarItem('user-desktop-symbolic', 'Bureau', GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DESKTOP));
            addSidebarItem('folder-documents-symbolic', 'Documents', GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DOCUMENTS));
            addSidebarItem('folder-download-symbolic', 'Téléchargements', GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DOWNLOAD));
            addSidebarItem('folder-music-symbolic', 'Musiques', GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_MUSIC));
            addSidebarItem('folder-pictures-symbolic', 'Images', GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PICTURES));
            addSidebarItem('folder-videos-symbolic', 'Vidéos', GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_VIDEOS));
            addSidebarItem('user-trash-symbolic', 'Corbeille', 'trash:///');
            
            leftBox.append(new Gtk.Separator({ margin_top: 5, margin_bottom: 5 }));

            const treeScroll = new Gtk.ScrolledWindow({ hexpand: true, vexpand: true });
            leftBox.append(treeScroll);
            
            const treeRootStore = new Gio.ListStore({ item_type: Gio.File });
            treeRootStore.append(Gio.File.new_for_path('/'));

            // Ajoute les lecteurs actuellement montés.
            const volumeMonitor = Gio.VolumeMonitor.get();
            const mounts = volumeMonitor.get_mounts();
            for (let mount of mounts) {
                const rootDir = mount.get_root();
                if (rootDir) {
                    treeRootStore.append(rootDir);
                }
            }

            const treeModel = Gtk.TreeListModel.new(treeRootStore, false, false, (file) => {
                const info = file.query_info('standard::type', Gio.FileQueryInfoFlags.NONE, null);
                if (info.get_file_type() !== Gio.FileType.DIRECTORY) return null;
                const childStore = new Gio.ListStore({ item_type: Gio.File });
                file.enumerate_children_async('standard::name', Gio.FileQueryInfoFlags.NONE, GLib.PRIORITY_DEFAULT, null, (sObj, res) => {
                    try {
                        const enumerator = sObj.enumerate_children_finish(res);
                        const getNextBatch = () => {
                            enumerator.next_files_async(50, GLib.PRIORITY_DEFAULT, null, (eObj, eRes) => {
                                const files = eObj.next_files_finish(eRes);
                                if (files.length > 0) {
                                    for (let f of files) childStore.append(sObj.get_child(f.get_name()));
                                    getNextBatch();
                                } else { enumerator.close_async(GLib.PRIORITY_DEFAULT, null, null); }
                            });
                        };
                        getNextBatch();
                    } catch (e) {} 
                });
                return childStore;
            });

            const treeSelection = new Gtk.SingleSelection({ model: treeModel });
            const treeFactory = new Gtk.SignalListItemFactory();
            const factoryHandlers = [];
            let _id;
            _id = treeFactory.connect('setup', (f, item) => {
                const expander = new Gtk.TreeExpander();
                const box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 5 });
                box.append(new Gtk.Image()); 
                box.append(new Gtk.Label({ xalign: 0, margin_top: 2, margin_bottom: 2 }));
                expander.set_child(box);
                item.set_child(expander);
            });
            factoryHandlers.push({ factory: treeFactory, id: _id });
            _id = treeFactory.connect('bind', (f, item) => {
                const treeRow = item.get_item();
                const file = treeRow.get_item();
                const expander = item.get_child();
                expander.set_list_row(treeRow);
                const box = expander.get_child();
                
                if (file.get_path() === '/') {
                    box.get_last_child().set_text("Système de fichiers");
                    box.get_first_child().set_from_icon_name("drive-harddisk-system-symbolic");
                } else {
                    box.get_last_child().set_text(file.get_basename());
                    box.get_first_child().set_from_icon_name("folder-symbolic"); 
                }
            });

            const treeView = new Gtk.ListView({ model: treeSelection, factory: treeFactory });
            treeView.add_css_class('navigation-sidebar'); 
            treeScroll.set_child(treeView);

            sidebarList.connect('row-activated', (listbox, row) => {
                if (row.targetPath) loadDirectory(row.targetPath);
                listbox.unselect_all();
                treeSelection.set_selected(Gtk.INVALID_LIST_POSITION); 
            });
            treeView.connect('activate', (view, pos) => {
                loadDirectory(treeModel.get_item(pos).get_item().get_path());
                sidebarList.unselect_all();
            });

            // Vue des fichiers.
            const rightScroll = new Gtk.ScrolledWindow({ hexpand: true, vexpand: true });
            paned.set_end_child(rightScroll);
            
            const selectionModel = new Gtk.MultiSelection({ model: fileStore });

            // Vues liste et grille.
            const viewStack = new Gtk.Stack({ transition_type: Gtk.StackTransitionType.CROSSFADE });
            rightScroll.set_child(viewStack);

            const columnView = new Gtk.ColumnView({ model: selectionModel, hexpand: true, vexpand: true });
            const listOverlay = new Gtk.Overlay();
            listOverlay.set_child(columnView);
            const emptyFolderLabel = new Gtk.Label({
                label: 'Le dossier est vide',
                halign: Gtk.Align.CENTER,
                valign: Gtk.Align.CENTER
            });
            emptyFolderLabel.add_css_class('dim-label');
            emptyFolderLabel.set_visible(false);
            listOverlay.add_overlay(emptyFolderLabel);
            viewStack.add_named(listOverlay, "list");
            let gridView = null;

            const updateEmptyFolderState = () => {
                const hasItems = fileStore.get_n_items() > 0;
                emptyFolderLabel.set_visible(directoryScanComplete && !hasItems);
                columnView.set_enable_rubberband(hasItems);
                if (gridView) gridView.set_enable_rubberband(hasItems);
            };
            const markDirectoryScanComplete = () => {
                directoryScanComplete = true;
                updateEmptyFolderState();
            };
            fileStore.connect('items-changed', updateEmptyFolderState);

            const addDragSource = (item) => {
                const dragSource = new Gtk.DragSource({ actions: Gdk.DragAction.COPY });
                dragSource.connect('prepare', () => {
                    const files = getSelectedFiles().map(selectedItem => selectedItem.file);
                    if (files.length === 0) return null;

                    const uriList = files.map(file => `${file.get_uri()}\r\n`).join('');
                    return Gdk.ContentProvider.new_for_bytes(
                        'text/uri-list',
                        GLib.Bytes.new(new TextEncoder().encode(uriList))
                    );
                });
                item.get_child().add_controller(dragSource);
            };

            const gridFactory = new Gtk.SignalListItemFactory();
            _id = gridFactory.connect('setup', (f, item) => {
                const box = new Gtk.Box({ 
                    orientation: Gtk.Orientation.VERTICAL, 
                    spacing: 8, 
                    margin_top: 12, margin_bottom: 12, 
                    margin_start: 12, margin_end: 12 
                });
                
                const image = new Gtk.Image({ pixel_size: 64, halign: Gtk.Align.CENTER });
                
                const label = new Gtk.Label({ 
                    halign: Gtk.Align.CENTER, 
                    max_width_chars: 14, 
                    wrap: true, 
                    justify: Gtk.Justification.CENTER 
                });
                label.set_lines(2);
                label.set_ellipsize(3);

                box.append(image);
                box.append(label);
                item.set_child(box);
                addDragSource(item);
            });
            factoryHandlers.push({ factory: gridFactory, id: _id });
            _id = gridFactory.connect('bind', (f, item) => {
                const fileInfo = item.get_item().info;       
                const box = item.get_child();
                box.get_last_child().set_text(fileInfo.get_name());
                if (fileInfo.get_icon()) box.get_first_child().set_from_gicon(fileInfo.get_icon());
            });
            factoryHandlers.push({ factory: gridFactory, id: _id });

            gridView = new Gtk.GridView({ 
                model: selectionModel, 
                factory: gridFactory, 
                hexpand: true, 
                vexpand: true,
                max_columns: 20
            });
            viewStack.add_named(gridView, "grid");

            locationsList = new Gtk.ListBox({ selection_mode: Gtk.SelectionMode.SINGLE });
            locationsList.add_css_class('navigation-sidebar');
            locationsList.connect('row-activated', (list, row) => loadDirectory(row.targetPath));

            locationsView = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 8 });
            const locationsHeader = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, margin_top: 8, margin_start: 8, margin_end: 8 });
            const backToFilesButton = new Gtk.Button({ icon_name: 'go-previous-symbolic', tooltip_text: 'Retour aux fichiers' });
            backToFilesButton.add_css_class('flat');
            backToFilesButton.connect('clicked', () => viewStack.set_visible_child_name('list'));
            locationsTitle = new Gtk.Label({ label: 'Emplacements', xalign: 0, hexpand: true });
            locationsTitle.add_css_class('title-3');
            locationsHeader.append(backToFilesButton);
            locationsHeader.append(locationsTitle);
            locationsView.append(locationsHeader);
            const locationsScroll = new Gtk.ScrolledWindow({ hexpand: true, vexpand: true });
            locationsScroll.set_child(locationsList);
            locationsView.append(locationsScroll);
            viewStack.add_named(locationsView, 'locations');

            const parseDroppedUris = (text) => text
                .split(/\r?\n/)
                .filter(line => line && !line.startsWith('#'))
                .map(line => {
                    try { return Gio.File.new_for_uri(line); } catch (e) { return null; }
                })
                .filter(file => file !== null);

            const getDroppedFiles = (value) => {
                if (value && typeof value.get_files === 'function') return value.get_files();
                if (typeof value === 'string') return parseDroppedUris(value);
                return [];
            };

            const dropTarget = Gtk.DropTarget.new(Gdk.FileList, Gdk.DragAction.COPY);
            dropTarget.set_gtypes([Gdk.FileList, GObject.TYPE_STRING]);
            dropTarget.connect('drop', (target, value) => {
                if (!currentDir) return false;
                const files = getDroppedFiles(value);
                if (files.length === 0) return false;
                FileOps.copy(files, currentDir, () => loadDirectory(currentDir.get_path(), false), (error) => console.error(error.message));
                return true;
            });
            rightScroll.add_controller(dropTarget);

            // Colonnes de la vue liste.
            
            const nameFactory = new Gtk.SignalListItemFactory();
            _id = nameFactory.connect('setup', (f, item) => {
                const box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 });
                box.append(new Gtk.Image()); box.append(new Gtk.Label({ xalign: 0 }));
                item.set_child(box);
                addDragSource(item);
            });
            factoryHandlers.push({ factory: nameFactory, id: _id });
            _id = nameFactory.connect('bind', (f, item) => {
                const fileInfo = item.get_item().info;       
                const box = item.get_child();
                box.get_last_child().set_text(fileInfo.get_name());
                if (fileInfo.get_icon()) box.get_first_child().set_from_gicon(fileInfo.get_icon());
            });
            factoryHandlers.push({ factory: nameFactory, id: _id });

            const sizeCancellables = new WeakMap();
            const activeSizeCancellables = new Set();

            const sizeFactory = new Gtk.SignalListItemFactory();
            _id = sizeFactory.connect('setup', (f, item) => item.set_child(new Gtk.Label({ xalign: 1 })));
            factoryHandlers.push({ factory: sizeFactory, id: _id });
            _id = sizeFactory.connect('bind', (f, item) => {
                const fileInfo = item.get_item().info; 
                const childFile = item.get_item().file;
                const label = item.get_child();

                let existingCancel = sizeCancellables.get(item);
                if (existingCancel) {
                    existingCancel.cancel();
                    sizeCancellables.delete(item);
                }

                if (fileInfo.get_file_type() === Gio.FileType.DIRECTORY) {
                    label.set_text("..."); 
                    
                    const cancellable = new Gio.Cancellable();
                    sizeCancellables.set(item, cancellable);
                    activeSizeCancellables.add(cancellable);
                    
                    childFile.enumerate_children_async(
                        'standard::name', 
                        Gio.FileQueryInfoFlags.NONE, 
                        GLib.PRIORITY_LOW, 
                        cancellable, 
                        (source, res) => {
                            try {
                                const enumerator = source.enumerate_children_finish(res);
                                let totalCount = 0;
                                
                                const countNextBatch = () => {
                                    enumerator.next_files_async(500, GLib.PRIORITY_LOW, cancellable, (eSource, eRes) => {
                                        try {
                                            const files = eSource.next_files_finish(eRes);
                                            if (files.length > 0) {
                                                totalCount += files.length;
                                                countNextBatch(); 
                                            } else {
                                                if (!cancellable.is_cancelled()) {
                                                    label.set_text(`${totalCount} élément${totalCount > 1 ? 's' : ''}`);
                                                }
                                                activeSizeCancellables.delete(cancellable);
                                                enumerator.close_async(GLib.PRIORITY_LOW, null, null);
                                            }
                                        } catch (e) {
                                            activeSizeCancellables.delete(cancellable);
                                            if (!cancellable.is_cancelled()) label.set_text("  ");
                                        }
                                    });
                                };
                                countNextBatch();
                            } catch (e) {
                                activeSizeCancellables.delete(cancellable);
                                if (!cancellable.is_cancelled()) label.set_text("  ");
                            }
                        }
                    );
                } else {
                    label.set_text(GLib.format_size(fileInfo.get_size())); 
                }
            });

            const dateFactory = new Gtk.SignalListItemFactory();
            _id = dateFactory.connect('setup', (f, item) => item.set_child(new Gtk.Label({ xalign: 0 })));
            factoryHandlers.push({ factory: dateFactory, id: _id });
            _id = dateFactory.connect('bind', (f, item) => {
                const dt = item.get_item().info.get_modification_date_time();
                item.get_child().set_text(dt ? dt.format("%d/%m/%Y %H:%M") : "  "); 
            });
            factoryHandlers.push({ factory: dateFactory, id: _id });

            const creationDateFactory = new Gtk.SignalListItemFactory();
            _id = creationDateFactory.connect('setup', (f, item) => item.set_child(new Gtk.Label({ xalign: 0 })));
            factoryHandlers.push({ factory: creationDateFactory, id: _id });
            _id = creationDateFactory.connect('bind', (f, item) => {
                const dt = item.get_item().info.get_creation_date_time();
                item.get_child().set_text(dt ? dt.format("%d/%m/%Y %H:%M") : "  "); 
            });
            factoryHandlers.push({ factory: creationDateFactory, id: _id });

            const typeFactory = new Gtk.SignalListItemFactory();
            _id = typeFactory.connect('setup', (f, item) => item.set_child(new Gtk.Label({ xalign: 0 })));
            factoryHandlers.push({ factory: typeFactory, id: _id });
            _id = typeFactory.connect('bind', (f, item) => {
                const fileInfo = item.get_item().info;
                if (fileInfo.get_file_type() === Gio.FileType.DIRECTORY) {
                    item.get_child().set_text("Dossier");
                } else {
                    const ct = fileInfo.get_content_type();
                    item.get_child().set_text(ct ? Gio.content_type_get_description(ct) || "Fichier" : "Fichier");
                }
            });
            factoryHandlers.push({ factory: typeFactory, id: _id });

            const authorsFactory = new Gtk.SignalListItemFactory();
            _id = authorsFactory.connect('setup', (f, item) => item.set_child(new Gtk.Label({ xalign: 0 })));
            factoryHandlers.push({ factory: authorsFactory, id: _id });
            _id = authorsFactory.connect('bind', (f, item) => {
                const info = item.get_item().info;
                const val = info.get_attribute_string('metadata::author') || " ";
                item.get_child().set_text(val);
            });
            factoryHandlers.push({ factory: authorsFactory, id: _id });

            const keywordsFactory = new Gtk.SignalListItemFactory();
            _id = keywordsFactory.connect('setup', (f, item) => item.set_child(new Gtk.Label({ xalign: 0 })));
            factoryHandlers.push({ factory: keywordsFactory, id: _id });
            _id = keywordsFactory.connect('bind', (f, item) => {
                const info = item.get_item().info;
                const val = info.get_attribute_string('metadata::keywords') || info.get_attribute_string('metadata::annotation') || "  ";
                item.get_child().set_text(val);
            });
            factoryHandlers.push({ factory: keywordsFactory, id: _id });

            const titleMetaFactory = new Gtk.SignalListItemFactory();
            _id = titleMetaFactory.connect('setup', (f, item) => item.set_child(new Gtk.Label({ xalign: 0 })));
            factoryHandlers.push({ factory: titleMetaFactory, id: _id });
            _id = titleMetaFactory.connect('bind', (f, item) => {
                const info = item.get_item().info;
                const val = info.get_attribute_string('metadata::title') || "  ";
                item.get_child().set_text(val);
            });
            factoryHandlers.push({ factory: titleMetaFactory, id: _id });

            let columnConfig = [
                { id: 'name', title: "Nom", factory: nameFactory, expand: true, visible: true, locked: true },
                { id: 'modified', title: "Modifié le", factory: dateFactory, expand: false, visible: true, locked: false },
                { id: 'type', title: "Type", factory: typeFactory, expand: false, visible: true, locked: false },
                { id: 'size', title: "Taille", factory: sizeFactory, expand: false, visible: true, locked: false },
                { id: 'created', title: "Date de création", factory: creationDateFactory, expand: false, visible: false, locked: false },
                { id: 'authors', title: "Auteurs", factory: authorsFactory, expand: false, visible: false, locked: false },
                { id: 'keywords', title: "Mots clés", factory: keywordsFactory, expand: false, visible: false, locked: false },
                { id: 'titleMeta', title: "Titre", factory: titleMetaFactory, expand: false, visible: false, locked: false }
            ];

            const rebuildColumns = () => {
                const columns = columnView.get_columns();
                for (let i = columns.get_n_items() - 1; i >= 0; i--) {
                    columnView.remove_column(columns.get_item(i));
                }
                for (let conf of columnConfig) {
                    if (conf.visible) {
                        columnView.append_column(new Gtk.ColumnViewColumn({
                            title: conf.title,
                            factory: conf.factory,
                            expand: conf.expand
                        }));
                    }
                }
            };

            rebuildColumns(); 

            const headerClick = new Gtk.GestureClick({ button: 1 });
            columnView.add_controller(headerClick);

            headerClick.connect('pressed', (gesture, n_press, x, y) => {
                if (y > 40) return; 

                const colWin = new Gtk.Window({
                    transient_for: window,
                    modal: false,
                    title: "Affichage des colonnes",
                    default_width: 300,
                    resizable: false,
                    destroy_with_parent: true
                });

                const box = new Gtk.Box({
                    orientation: Gtk.Orientation.VERTICAL,
                    spacing: 12,
                    margin_top: 15, margin_bottom: 15,
                    margin_start: 15, margin_end: 15
                });
                colWin.set_child(box);

                box.append(new Gtk.Label({ 
                    label: "Colonnes à afficher :", 
                    xalign: 0,
                    css_classes: ['heading']
                }));

                box.append(new Gtk.Separator({ margin_bottom: 5 }));

                for (let conf of columnConfig) {
                    const check = new Gtk.CheckButton({ 
                        label: conf.title, 
                        active: conf.visible 
                    });
                    
                    if (conf.locked) check.set_sensitive(false); 
                    
                    check.connect('toggled', () => {
                        conf.visible = check.get_active();
                        rebuildColumns();
                    });
                    
                    box.append(check);
                }

                colWin.present();
            });

            const openFileItem = (fileItem, forceMenu = false) => {
                const info = fileItem.info;
                const childFile = fileItem.file;

                const showSecurityDialog = (onOpenAsText) => {
                    const dialog = new Gtk.Window({
                        transient_for: window,
                        modal: true,
                        title: "Fichier exécutable non approuvé",
                        default_width: 460,
                        resizable: false
                    });
                    const box = new Gtk.Box({
                        orientation: Gtk.Orientation.VERTICAL,
                        spacing: 12,
                        margin_top: 18,
                        margin_bottom: 18,
                        margin_start: 18,
                        margin_end: 18
                    });
                    dialog.set_child(box);
                    box.append(new Gtk.Label({
                        label: `Le fichier « ${info.get_name()} » est un exécutable non approuvé. Que souhaitez-vous faire ?`,
                        wrap: true,
                        xalign: 0
                    }));

                    const buttons = new Gtk.Box({
                        orientation: Gtk.Orientation.HORIZONTAL,
                        spacing: 8,
                        halign: Gtk.Align.END
                    });
                    const cancelButton = new Gtk.Button({ label: "Annuler" });
                    const textButton = new Gtk.Button({ label: "Ouvrir comme texte" });
                    const runButton = new Gtk.Button({ label: "Exécuter quand même" });

                    runButton.add_css_class('destructive-action');

                    runButton.connect('clicked', () => {
                        dialog.close();
                        try {
                            const safePath = GLib.shell_quote(childFile.get_path());
                            const appInfo = Gio.AppInfo.create_from_commandline(
                                safePath, 
                                null, 
                                Gio.AppInfoCreateFlags.NONE
                            );
                            appInfo.launch([], null);
                        } catch (e) {
                            console.error("Impossible de lancer l'exécutable :", e.message);
                        }
                    });
                    
                    cancelButton.connect('clicked', () => dialog.close());
                    textButton.connect('clicked', () => {
                        dialog.close();
                        onOpenAsText();
                    });
                    
                    buttons.append(runButton);
                    buttons.append(cancelButton);
                    buttons.append(textButton);
                    box.append(buttons);
                    dialog.present();
                };

                const openAsText = () => {
                    const textApp = Gio.AppInfo.get_default_for_type('text/plain', false);
                    if (textApp) {
                        try {
                            textApp.launch([childFile], null);
                            return;
                        } catch (e) { }
                    }
                    console.error(`Aucun éditeur texte disponible pour ${info.get_name()}`);
                };

                let mode = 0;
                try {
                    const detailedInfo = childFile.query_info(
                        'standard::type,standard::name,standard::content-type,unix::mode',
                        Gio.FileQueryInfoFlags.NONE,
                        null
                    );
                    mode = detailedInfo.get_attribute_uint32('unix::mode');
                } catch (e) { }

                const name = info.get_name().toLowerCase();
                const sensitiveExtension = name.endsWith('.sh') ||
                    name.endsWith('.bash') ||
                    name.endsWith('.desktop');
                const isExecutable = (mode & 0o111) !== 0;

                if (!forceMenu && info.get_file_type() === Gio.FileType.DIRECTORY) {
                    loadDirectory(childFile.get_path());
                } else if (isExecutable || sensitiveExtension) {
                    showSecurityDialog(openAsText);
                } else {
                    const launchChooser = () => {
                        const appChooser = new Gtk.AppChooserDialog({ transient_for: window, modal: true, gfile: childFile });
                        appChooser.connect('response', (dialog, response_id) => {
                            if (response_id === Gtk.ResponseType.OK && dialog.get_app_info()) {
                                try { dialog.get_app_info().launch([childFile], null); } catch (err) {}
                            }
                            dialog.destroy(); 
                        });
                        appChooser.present();
                    };

                    if (forceMenu) {
                        launchChooser();
                    } else {
                        try { Gio.AppInfo.launch_default_for_uri(childFile.get_uri(), null); } 
                        catch (e) { launchChooser(); }
                    }
                }
            };

            const openSelected = () => getSelectedFiles().forEach(f => openFileItem(f, false));
            const openWithSelected = () => getSelectedFiles().forEach(f => openFileItem(f, true));

            const renameSelected = () => {
                const selectedFiles = getSelectedFiles();
                if (selectedFiles.length !== 1) return; 

                const fileItem = selectedFiles[0];
                const currentName = fileItem.info.get_name();

                promptNewName("Renommer", currentName, (newName) => {
                    if (newName !== currentName) {
                        FileOps.rename(fileItem.file, newName, 
                            () => loadDirectory(currentDir.get_path(), false),
                            (err) => console.error("Erreur de renommage : " + err.message)
                        );
                    }
                });
            };

            const tabId = Math.random().toString(36).substring(7);

            // Actions de changement de vue.
            const viewGridAction = new Gio.SimpleAction({ name: `view-grid-${tabId}` });
            viewGridAction.connect('activate', () => viewStack.set_visible_child_name("grid"));
            window.add_action(viewGridAction);

            const viewListAction = new Gio.SimpleAction({ name: `view-list-${tabId}` });
            viewListAction.connect('activate', () => viewStack.set_visible_child_name("list"));
            window.add_action(viewListAction);

            columnView.connect('activate', (view, position) => openFileItem(fileStore.get_item(position), false));
            gridView.connect('activate', (view, position) => openFileItem(fileStore.get_item(position), false));

            // Menu contextuel des fichiers.
            const attachRightClick = (widget) => {
                const contextMenu = new Gtk.PopoverMenu({ has_arrow: false });
                contextMenu.set_parent(window); 

                const rightClickGesture = new Gtk.GestureClick({ button: 3 }); 
                widget.add_controller(rightClickGesture);

                rightClickGesture.connect('pressed', (gesture, n_press, x, y) => {
                    if (widget === columnView && y <= 40) return; 
                    
                    const menu = new Gio.Menu();
                    const selectedFiles = getSelectedFiles();

                    if (selectedFiles.length > 0) {
                        const openSection = new Gio.Menu();
                        openSection.append("Ouvrir", "win.open"); 
                        openSection.append("Ouvrir avec...", "win.open-with");
                        menu.append_section(null, openSection);

                        const editSection = new Gio.Menu();
                        editSection.append("Couper", "win.cut");
                        editSection.append("Copier", "win.copy");

                        if (selectedFiles.length === 1) {
                            editSection.append("Renommer", "win.rename");
                        }

                        editSection.append("Supprimer", "win.delete");
                        menu.append_section(null, editSection);
                    }

                    if (this.clipboard && this.clipboard.files && this.clipboard.files.length > 0) {
                        const pasteSection = new Gio.Menu();
                        pasteSection.append(`Coller (${this.clipboard.files.length})`, "win.paste");
                        menu.append_section(null, pasteSection);
                    }

                    const affichageMenu = new Gio.Menu();
                    affichageMenu.append("Grandes icônes", `win.view-grid-${tabId}`);
                    affichageMenu.append("Liste", `win.view-list-${tabId}`);
                    menu.append_submenu("Affichage", affichageMenu);

                    const trierMenu = new Gio.Menu();
                    trierMenu.append("Par nom", "win.menu-action");
                    trierMenu.append("Par date", "win.menu-action");
                    menu.append_submenu("Trier par", trierMenu);

                    const regrouperMenu = new Gio.Menu();
                    regrouperMenu.append("Aucun", "win.menu-action");
                    menu.append_submenu("Regrouper par", regrouperMenu);

                    const actionSection = new Gio.Menu();
                    const newMenu = new Gio.Menu();
                    newMenu.append("Dossier", "win.new-folder");
                    newMenu.append("Document texte", "win.new-file");
                    
                    actionSection.append_submenu("Nouveau", newMenu);
                    if (selectedFiles.length == 1) {
                        actionSection.append("Propriétés", "win.properties");
                    }
                    menu.append_section(null, actionSection);

                    contextMenu.set_menu_model(menu);
                    
                    const event = gesture.get_last_event(null);
                    if (event) {
                        const [res, rootX, rootY] = event.get_position();
                        const headerHeight = window.get_allocated_height() - tabView.get_allocated_height();
                        
                        contextMenu.set_pointing_to(new Gdk.Rectangle({ 
                            x: Math.round(rootX), 
                            y: Math.round(rootY - headerHeight), 
                            width: 0, 
                            height: 0 
                        }));
                    }

                    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                        if (isCleanedUp) return GLib.SOURCE_REMOVE;
                        contextMenu.popup();
                        return GLib.SOURCE_REMOVE;
                    });
                });
                
                return contextMenu;
            };

            const colMenu = attachRightClick(columnView);
            const gridMenu = attachRightClick(gridView);

            // Méthodes internes de l'onglet
            const getSelectedFiles = () => {
                const bitset = selectionModel.get_selection();
                const files = [];
                for (let i = 0; i < selectionModel.get_n_items(); i++) {
                    if (bitset.contains(i)) files.push(selectionModel.get_item(i));
                }
                return files;
            };

            const promptNewName = (title, defaultName, onConfirm) => {
                const dialog = new Gtk.Window({ transient_for: window, modal: true, title: title, default_width: 300, resizable: false });
                const box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 12, margin_top: 15, margin_bottom: 15, margin_start: 15, margin_end: 15 });
                dialog.set_child(box);
                
                const entry = new Gtk.Entry({ text: defaultName });
                box.append(entry);

                const errorLabel = new Gtk.Label({ 
                    label: "Le caractère '/' est interdit.", 
                    xalign: 0, 
                    visible: false 
                });
                errorLabel.add_css_class('error');
                box.append(errorLabel);

                const btnBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, halign: Gtk.Align.END });
                const btnCancel = new Gtk.Button({ label: "Annuler" });
                const btnCreate = new Gtk.Button({ label: "Créer" });
                btnBox.append(btnCancel); btnBox.append(btnCreate);
                box.append(btnBox);

                btnCancel.connect('clicked', () => dialog.close());
                
                const confirm = () => { 
                    const val = entry.get_text().trim();
                    if (val !== "") { 
                        if (val.includes('/')) {
                            entry.add_css_class('error');
                            errorLabel.set_visible(true);
                            return; 
                        }
                        onConfirm(val); 
                        dialog.close(); 
                    } 
                };

                entry.connect('changed', () => {
                    entry.remove_css_class('error');
                    errorLabel.set_visible(false);
                });

                btnCreate.connect('clicked', confirm);
                entry.connect('activate', confirm); 
                dialog.present();
            };

            const openPropertiesWindow = (fileItem) => {
                const fileInfo = fileItem.info;
                const childFile = fileItem.file; 
                
                const fileName = fileInfo.get_name();
                
                let fullInfo;
                try {
                    fullInfo = childFile.query_info('*', Gio.FileQueryInfoFlags.NONE, null);
                } catch(e) {
                    fullInfo = fileInfo;
                }

                const propWin = new Gtk.Window({
                    transient_for: window,
                    title: "Propriétés de " + fileName,
                    default_width: 400,
                    default_height: 500,
                    modal: false
                });
                propertyWindows.add(propWin);
                propWin.connect('close-request', () => {
                    propertyWindows.delete(propWin);
                    return false;
                });

                const notebook = new Gtk.Notebook();
                propWin.set_child(notebook);

                const generalBox = new Gtk.Box({ 
                    orientation: Gtk.Orientation.VERTICAL, 
                    spacing: 12, margin_top: 15, margin_bottom: 15, margin_start: 15, margin_end: 15 
                });
                notebook.append_page(generalBox, new Gtk.Label({ label: "Général" }));

                const headerBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 15 });
                const iconImage = new Gtk.Image({ pixel_size: 64 });
                const gicon = fullInfo.get_icon();
                if (gicon) iconImage.set_from_gicon(gicon);
                
                const nameEntry = new Gtk.Entry({ text: fileName, hexpand: true, valign: Gtk.Align.CENTER });
                headerBox.append(iconImage);
                headerBox.append(nameEntry);
                generalBox.append(headerBox);

                generalBox.append(new Gtk.Separator({ margin_top: 5, margin_bottom: 5 }));

                const grid1 = new Gtk.Grid({ column_spacing: 30, row_spacing: 8 });
                generalBox.append(grid1);

                let row1 = 0;
                const addInfo1 = (labelStr, valueStr) => {
                    grid1.attach(new Gtk.Label({ label: labelStr + " :", xalign: 0 }), 0, row1, 1, 1);
                    grid1.attach(new Gtk.Label({ label: valueStr, xalign: 0, selectable: true }), 1, row1, 1, 1);
                    row1++;
                };

                const isDir = fullInfo.get_file_type() === Gio.FileType.DIRECTORY;
                let typeString = "Dossier de fichiers";
                if (!isDir) {
                    const contentType = fullInfo.get_content_type();
                    typeString = contentType ? Gio.content_type_get_description(contentType) : "Fichier";
                }
                
                addInfo1("Type", typeString);
                addInfo1("Emplacement", currentDir.get_path());
                
                if (!isDir) {
                    const size = fullInfo.get_size();
                    const allocatedSize = fullInfo.get_attribute_uint64('standard::allocated-size');
                    addInfo1("Taille", `${GLib.format_size(size)} (${size} octets)`);
                    addInfo1("Taille sur le disque", `${GLib.format_size(allocatedSize)} (${allocatedSize} octets)`);
                }

                generalBox.append(new Gtk.Separator({ margin_top: 5, margin_bottom: 5 }));

                const grid2 = new Gtk.Grid({ column_spacing: 30, row_spacing: 8 });
                generalBox.append(grid2);

                let row2 = 0;
                const addInfo2 = (labelStr, dt) => {
                    const val = dt ? dt.format("%A %d %B %Y, %H:%M:%S") : "Inconnu";
                    grid2.attach(new Gtk.Label({ label: labelStr + " :", xalign: 0 }), 0, row2, 1, 1);
                    grid2.attach(new Gtk.Label({ label: val, xalign: 0, selectable: true }), 1, row2, 1, 1);
                    row2++;
                };

                addInfo2("Créé le", fullInfo.get_creation_date_time());
                addInfo2("Modifié le", fullInfo.get_modification_date_time());
                addInfo2("Dernier accès", fullInfo.get_access_date_time());

                generalBox.append(new Gtk.Separator({ margin_top: 5, margin_bottom: 5 }));

                const btnBox = new Gtk.Box({ 
                    orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, halign: Gtk.Align.END, margin_top: 10 
                });
                const btnOk = new Gtk.Button({ label: "OK", width_request: 80 });
                const btnApply = new Gtk.Button({ label: "Appliquer", width_request: 80 });
                
                const applyRename = (closeAfter = false) => {
                    const newName = nameEntry.get_text();
                    if (newName.trim() === "" || newName === fileName) {
                        if (closeAfter) propWin.close();
                        return;
                    }
                    btnOk.set_sensitive(false); btnApply.set_sensitive(false); nameEntry.set_sensitive(false);
                    FileOps.rename(childFile, newName, 
                        (newFile) => {
                            if (isCleanedUp) return;
                            loadDirectory(currentDir.get_path(), false);
                            if (closeAfter) propWin.close();
                            else { btnOk.set_sensitive(true); btnApply.set_sensitive(true); nameEntry.set_sensitive(true); }
                        },
                        (err) => {
                            if (isCleanedUp) return;
                            console.error(err.message);
                            btnOk.set_sensitive(true); btnApply.set_sensitive(true); nameEntry.set_sensitive(true);
                        }
                    );
                };

                btnOk.connect('clicked', () => applyRename(true)); 
                btnApply.connect('clicked', () => applyRename(false));
                
                btnBox.append(btnOk); btnBox.append(btnApply);
                generalBox.append(btnBox);

                const metaScroll = new Gtk.ScrolledWindow({ 
                    hexpand: true, 
                    vexpand: true,
                    margin_top: 15, margin_bottom: 15, margin_start: 15, margin_end: 15 
                });
                
                const metaGrid = new Gtk.Grid({ column_spacing: 20, row_spacing: 10 });
                metaScroll.set_child(metaGrid);
                
                notebook.append_page(metaScroll, new Gtk.Label({ label: "Métadonnées" }));

                const attributes = fullInfo.list_attributes(null);
                attributes.sort();

                let metaRow = 0;
                for (let attr of attributes) {
                    const val = fullInfo.get_attribute_as_string(attr) || "  ";
                    
                    const attrLabel = new Gtk.Label({ label: attr, xalign: 0 });
                    attrLabel.add_css_class('dim-label'); 
                    
                    const valLabel = new Gtk.Label({ 
                        label: val, 
                        xalign: 0, 
                        selectable: true, 
                        wrap: true,       
                        max_width_chars: 40 
                    });
                    
                    metaGrid.attach(attrLabel, 0, metaRow, 1, 1);
                    metaGrid.attach(valLabel, 1, metaRow, 1, 1);
                    metaRow++;
                }

                propWin.present();
            };
            
            let directoryMonitor = null;
            let monitorRefreshId = null;

            const stopDirectoryMonitor = () => {
                if (directoryMonitor) {
                    directoryMonitor.cancel();
                    directoryMonitor = null;
                }
                if (monitorRefreshId) {
                    GLib.Source.remove(monitorRefreshId);
                    monitorRefreshId = null;
                }
            };

            const refreshMonitoredDirectory = () => {
                monitorRefreshId = null;
                if (isCleanedUp || !currentDir) return GLib.SOURCE_REMOVE;

                const query = searchEntry.get_text().trim().toLowerCase();
                fileStore.remove_all();
                directoryScanComplete = false;
                updateEmptyFolderState();
                navCancellable.cancel();
                navCancellable = new Gio.Cancellable();
                searchCancellable.cancel();
                searchCancellable = new Gio.Cancellable();

                if (query === "") {
                    scanDirectory(currentDir, navCancellable, "", false, markDirectoryScanComplete);
                } else {
                    scanDirectory(currentDir, searchCancellable, query, true, () => {
                        pathEntry.set_text(`Recherche : ${query}`);
                        pathEntry.set_sensitive(true);
                        markDirectoryScanComplete();
                    });
                }
                return GLib.SOURCE_REMOVE;
            };

            const scheduleMonitoredRefresh = () => {
                if (monitorRefreshId) return;
                monitorRefreshId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 150, refreshMonitoredDirectory);
            };

            const startDirectoryMonitor = () => {
                stopDirectoryMonitor();
                try {
                    directoryMonitor = currentDir.monitor_directory(Gio.FileMonitorFlags.WATCH_MOVES, null);
                    directoryMonitor.connect('changed', (monitor, file, otherFile, eventType) => {
                        if (isCleanedUp) return;
                        if (eventType === Gio.FileMonitorEvent.CHANGED ||
                            eventType === Gio.FileMonitorEvent.CREATED ||
                            eventType === Gio.FileMonitorEvent.DELETED ||
                            eventType === Gio.FileMonitorEvent.MOVED_IN ||
                            eventType === Gio.FileMonitorEvent.MOVED_OUT ||
                            eventType === Gio.FileMonitorEvent.RENAMED) {
                            scheduleMonitoredRefresh();
                        }
                    });
                } catch (e) {
                    directoryMonitor = null;
                }
            };

            const loadDirectory = (path, recordHistory = true) => {
                navCancellable.cancel();
                navCancellable = new Gio.Cancellable();
                stopDirectoryMonitor();

                if (recordHistory && currentDir) {
                    const currentPath = currentDir.get_path();
                    if (currentPath !== path) { historyBack.push(currentPath); historyForward = []; }
                }

                fileStore.remove_all(); 
                directoryScanComplete = false;
                updateEmptyFolderState();
                currentDir = path.includes('://') ? Gio.File.new_for_uri(path) : Gio.File.new_for_path(path);
                locationsMode = null;
                locationsActions.unselect_all();
                sidebarList.unselect_all();
                viewStack.set_visible_child_name('list');
                recordRecentLocation();
                pathEntry.set_text(path); 
                searchEntry.set_text(""); 

                if (path.startsWith('trash://')) {
                    pathEntry.set_text("Corbeille");
                    page.set_title("Corbeille");
                    updateBreadcrumbs("trash:///");
                } else {
                    const displayPath = currentDir.get_path() || path;
                    pathEntry.set_text(displayPath);
                    const basename = currentDir.get_basename();
                    page.set_title(basename ? basename : "Système");
                    updateBreadcrumbs(displayPath);
                }
                
                togglePathBtn.set_active(false);
                pathStack.set_visible_child_name("breadcrumbs");

                try {
                    const info = currentDir.query_info('standard::icon', Gio.FileQueryInfoFlags.NONE, null);
                    if (info && info.get_icon()) page.set_icon(info.get_icon());
                } catch (e) { }
                
                btnBack.set_sensitive(historyBack.length > 0);
                btnForward.set_sensitive(historyForward.length > 0);
                updateFavoriteButton();

                scanDirectory(currentDir, navCancellable, "", false, markDirectoryScanComplete);
                startDirectoryMonitor();
            };

            const scanDirectory = (dirObj, cancellable, searchQuery, isRecursive = false, onDone = null) => {
                const searchState = {
                    directoriesScanned: 0,
                    resultsFound: 0,
                    queue: [{ file: dirObj, depth: 0 }],
                    maxDirectories: isRecursive ? 256 : Number.POSITIVE_INFINITY,
                    maxResults: isRecursive ? 2000 : Number.POSITIVE_INFINITY,
                    maxDepth: isRecursive ? 8 : 0,
                    finished: false
                };

                const finish = () => {
                    if (searchState.finished) return;
                    searchState.finished = true;
                    if (onDone && !cancellable.is_cancelled()) onDone();
                };

                let scanNext;
                const scheduleScanNext = () => {
                    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                        scanNext();
                        return GLib.SOURCE_REMOVE;
                    });
                };

                scanNext = () => {
                    if (cancellable.is_cancelled() || searchState.finished) return;
                    if (searchState.queue.length === 0 ||
                        searchState.directoriesScanned >= searchState.maxDirectories ||
                        searchState.resultsFound >= searchState.maxResults) {
                        finish();
                        return;
                    }

                    const entry = searchState.queue.shift();
                    searchState.directoriesScanned++;
                    entry.file.enumerate_children_async(
                        'standard::*,time::*,metadata::*',
                        Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS,
                        GLib.PRIORITY_DEFAULT,
                        cancellable,
                        (source, res) => {
                            let enumerator;
                            try {
                                enumerator = source.enumerate_children_finish(res);
                            } catch (e) {
                                scheduleScanNext();
                                return;
                            }

                            const scheduleReadBatch = () => {
                                GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                                    readBatch();
                                    return GLib.SOURCE_REMOVE;
                                });
                            };

                            const readBatch = () => {
                                if (cancellable.is_cancelled()) {
                                    enumerator.close_async(GLib.PRIORITY_DEFAULT, null, null);
                                    return;
                                }

                                enumerator.next_files_async(50, GLib.PRIORITY_DEFAULT, cancellable, (batchSource, batchRes) => {
                                    let files;
                                    try {
                                        files = batchSource.next_files_finish(batchRes);
                                    } catch (e) {
                                        enumerator.close_async(GLib.PRIORITY_DEFAULT, null, scheduleScanNext);
                                        return;
                                    }

                                    if (files.length === 0) {
                                        enumerator.close_async(GLib.PRIORITY_DEFAULT, null, scheduleScanNext);
                                        return;
                                    }

                                    for (const info of files) {
                                        if (info.get_name().startsWith('.')) continue;
                                        const childFile = source.get_child(info.get_name());

                                        if (info.get_name().toLowerCase().includes(searchQuery) &&
                                            searchState.resultsFound < searchState.maxResults) {
                                            fileStore.append(new FileItem({ info, file: childFile }));
                                            searchState.resultsFound++;
                                        }

                                        if (isRecursive &&
                                            info.get_file_type() === Gio.FileType.DIRECTORY &&
                                            entry.depth < searchState.maxDepth &&
                                            searchState.queue.length + searchState.directoriesScanned < searchState.maxDirectories) {
                                            searchState.queue.push({ file: childFile, depth: entry.depth + 1 });
                                        }
                                    }

                                    if (searchState.resultsFound >= searchState.maxResults) {
                                        enumerator.close_async(GLib.PRIORITY_DEFAULT, null, () => finish());
                                    } else {
                                        scheduleReadBatch();
                                    }
                                });
                            };

                            scheduleReadBatch();
                        }
                    );
                };

                scanNext();
            };


            let searchTimeoutId = null;
            let searchCancellable = new Gio.Cancellable();

            searchEntry.connect('search-changed', () => {
                const query = searchEntry.get_text().toLowerCase();
                
                if (searchTimeoutId) GLib.Source.remove(searchTimeoutId);
                
                searchTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 400, () => {
                    searchTimeoutId = null;
                    
                    searchCancellable.cancel(); 
                    searchCancellable = new Gio.Cancellable();
                    
                    fileStore.remove_all(); 
                    directoryScanComplete = false;
                    updateEmptyFolderState();

                    pathEntry.set_text(`Recherche de "${query}"...`);
                    pathEntry.set_sensitive(false);
                    
                    if (query === "") {
                        if (currentDir) pathEntry.set_text(currentDir.get_path());
                        pathEntry.set_sensitive(true);
                        scanDirectory(currentDir, searchCancellable, "", false, markDirectoryScanComplete);
                    } else {
                        scanDirectory(currentDir, searchCancellable, query, true, () => {
                            pathEntry.set_text(`Recherche : ${query}`);
                            pathEntry.set_sensitive(true);
                            markDirectoryScanComplete();
                        });
                    }
                    return GLib.SOURCE_REMOVE;
                });
            });

            btnRefresh.connect('clicked', () => { if (currentDir) loadDirectory(currentDir.get_path()); });
            btnBack.connect('clicked', () => {
                if (historyBack.length > 0) {
                    const prevPath = historyBack.pop();
                    historyForward.push(currentDir.get_path());
                    loadDirectory(prevPath, false); 
                }
            });
            btnForward.connect('clicked', () => {
                if (historyForward.length > 0) {
                    const nextPath = historyForward.pop();
                    historyBack.push(currentDir.get_path()); 
                    loadDirectory(nextPath, false);
                }
            });
            
            pathEntry.connect('activate', () => {
                let typedPath = pathEntry.get_text().trim();
                if (typedPath.toLowerCase() === "corbeille") {
                    loadDirectory("trash:///");
                } else {
                    loadDirectory(typedPath);
                }
            });

            let isCleanedUp = false;
            const cleanup = () => {
                if (isCleanedUp) return;
                isCleanedUp = true;

                navCancellable.cancel();
                searchCancellable.cancel();
                stopDirectoryMonitor();
                if (searchTimeoutId) {
                    GLib.Source.remove(searchTimeoutId);
                    searchTimeoutId = null;
                }

                for (const cancellable of activeSizeCancellables) {
                    cancellable.cancel();
                }
                activeSizeCancellables.clear();

                for (const propWin of propertyWindows) {
                    propWin.close();
                }
                propertyWindows.clear();

                locationsMode = null;
                locationsList = null;
                locationsView = null;
                locationsTitle = null;

                // Ferme et détache les popovers avant que leur fenêtre parente ne soit détruite.
                for (const menu of [colMenu, gridMenu]) {
                    menu.popdown();
                    menu.unparent();
                }
                
            };

            // API interne exposée aux actions globales.
            page.explorerContext = {
                get currentDir() { return currentDir; }, 
                getSelectedFiles,
                loadDirectory,
                promptNewName,
                openPropertiesWindow,
                openSelected,       
                openWithSelected,  
                renameSelected, 
                cleanup             
            };

            loadDirectory(initialPath);
            tabRegistry.push({ page: page, context: page.explorerContext });
        };

        // Onglet initial.
        createNewTab(GLib.get_home_dir());
        window.present();
    }
});

const app = new App();
app.run([imports.system.programInvocationName].concat(ARGV));