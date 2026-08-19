#!/usr/bin/gjs

imports.gi.versions.Gtk = '4.0';
const { Gtk, Gio, GObject, GLib, Gdk, Adw } = imports.gi;

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

            const pathEntry = new Gtk.Entry({ hexpand: true, placeholder_text: "Chemin d'accès..." });
            topBar.append(pathEntry);

            const searchEntry = new Gtk.SearchEntry({ placeholder_text: "Rechercher...", width_request: 200 });
            topBar.append(searchEntry);

            const paned = new Gtk.Paned({ vexpand: true }); 
            tabContent.append(paned);

            // Navigation latérale et arborescence.
            const leftBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
            paned.set_start_child(leftBox);
            paned.set_position(250);

            const sidebarList = new Gtk.ListBox({ selection_mode: Gtk.SelectionMode.SINGLE });
            sidebarList.add_css_class('navigation-sidebar'); 
            leftBox.append(sidebarList);

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
            columnView.set_enable_rubberband(true);
            viewStack.add_named(columnView, "list");

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
            });
            factoryHandlers.push({ factory: gridFactory, id: _id });
            _id = gridFactory.connect('bind', (f, item) => {
                const fileInfo = item.get_item().info;       
                const box = item.get_child();
                box.get_last_child().set_text(fileInfo.get_name());
                if (fileInfo.get_icon()) box.get_first_child().set_from_gicon(fileInfo.get_icon());
            });
            factoryHandlers.push({ factory: gridFactory, id: _id });

            const gridView = new Gtk.GridView({ 
                model: selectionModel, 
                factory: gridFactory, 
                hexpand: true, 
                vexpand: true,
                max_columns: 20
            });
            gridView.set_enable_rubberband(true);
            viewStack.add_named(gridView, "grid");

            // Colonnes de la vue liste.
            
            const nameFactory = new Gtk.SignalListItemFactory();
            _id = nameFactory.connect('setup', (f, item) => {
                const box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 });
                box.append(new Gtk.Image()); box.append(new Gtk.Label({ xalign: 0 }));
                item.set_child(box);
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
                                            if (!cancellable.is_cancelled()) label.set_text("--");
                                        }
                                    });
                                };
                                countNextBatch();
                            } catch (e) {
                                activeSizeCancellables.delete(cancellable);
                                if (!cancellable.is_cancelled()) label.set_text("--");
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
                item.get_child().set_text(dt ? dt.format("%d/%m/%Y %H:%M") : "--"); 
            });
            factoryHandlers.push({ factory: dateFactory, id: _id });

            const creationDateFactory = new Gtk.SignalListItemFactory();
            _id = creationDateFactory.connect('setup', (f, item) => item.set_child(new Gtk.Label({ xalign: 0 })));
            factoryHandlers.push({ factory: creationDateFactory, id: _id });
            _id = creationDateFactory.connect('bind', (f, item) => {
                const dt = item.get_item().info.get_creation_date_time();
                item.get_child().set_text(dt ? dt.format("%d/%m/%Y %H:%M") : "--"); 
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
                const val = info.get_attribute_string('metadata::keywords') || info.get_attribute_string('metadata::annotation') || "--";
                item.get_child().set_text(val);
            });
            factoryHandlers.push({ factory: keywordsFactory, id: _id });

            const titleMetaFactory = new Gtk.SignalListItemFactory();
            _id = titleMetaFactory.connect('setup', (f, item) => item.set_child(new Gtk.Label({ xalign: 0 })));
            factoryHandlers.push({ factory: titleMetaFactory, id: _id });
            _id = titleMetaFactory.connect('bind', (f, item) => {
                const info = item.get_item().info;
                const val = info.get_attribute_string('metadata::title') || "--";
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

                if (!forceMenu && info.get_file_type() === Gio.FileType.DIRECTORY) {
                    loadDirectory(childFile.get_path());
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
                const btnBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, halign: Gtk.Align.END });
                const btnCancel = new Gtk.Button({ label: "Annuler" });
                const btnCreate = new Gtk.Button({ label: "Créer" });
                btnBox.append(btnCancel); btnBox.append(btnCreate);
                box.append(btnBox);

                btnCancel.connect('clicked', () => dialog.close());
                const confirm = () => { if (entry.get_text().trim() !== "") { onConfirm(entry.get_text().trim()); dialog.close(); } };
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
            
const loadDirectory = (path, recordHistory = true) => {
                navCancellable.cancel();
                navCancellable = new Gio.Cancellable();

                if (recordHistory && currentDir) {
                    const currentPath = currentDir.get_path();
                    if (currentPath !== path) { historyBack.push(currentPath); historyForward = []; }
                }

                fileStore.remove_all(); 
                currentDir = path.startsWith('trash://') ? Gio.File.new_for_uri(path) : Gio.File.new_for_path(path);
                pathEntry.set_text(path); 
                searchEntry.set_text(""); 

                if (path.startsWith('trash://')) {
                    pathEntry.set_text("Corbeille");
                    page.set_title("Corbeille");
                } else {
                    pathEntry.set_text(path);
                    const basename = currentDir.get_basename();
                    page.set_title(basename ? basename : "Système");
                }

                try {
                    const info = currentDir.query_info('standard::icon', Gio.FileQueryInfoFlags.NONE, null);
                    if (info && info.get_icon()) page.set_icon(info.get_icon());
                } catch (e) { }
                
                btnBack.set_sensitive(historyBack.length > 0);
                btnForward.set_sensitive(historyForward.length > 0);

                scanDirectory(currentDir, navCancellable, "");
            };

            const scanDirectory = (dirObj, cancellable, searchQuery, isRecursive = false) => {
                dirObj.enumerate_children_async('standard::*,time::*,metadata::*', Gio.FileQueryInfoFlags.NONE, GLib.PRIORITY_DEFAULT, cancellable, (sObj, res) => {
                    try {
                        const enumerator = sObj.enumerate_children_finish(res);
                        const getNextBatch = () => {
                            enumerator.next_files_async(50, GLib.PRIORITY_DEFAULT, cancellable, (eObj, eRes) => {
                                try {
                                    const files = eObj.next_files_finish(eRes);
                                    if (files.length > 0) {
                                        for (let info of files) {
                                            if (!info.get_name().startsWith('.')) {
                                                const childFile = sObj.get_child(info.get_name());
                                                if (searchQuery === "" || info.get_name().toLowerCase().includes(searchQuery)) {
                                                    fileStore.append(new FileItem({ info: info, file: childFile }));
                                                }
                                                if (isRecursive && info.get_file_type() === Gio.FileType.DIRECTORY) {
                                                    scanDirectory(childFile, cancellable, searchQuery, true);
                                                }
                                            }
                                        }
                                        getNextBatch(); 
                                    } else { enumerator.close_async(GLib.PRIORITY_DEFAULT, null, null); }
                                } catch (e) { }
                            });
                        };
                        getNextBatch();
                    } catch (e) { }
                });
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

                    pathEntry.set_text(`Recherche de "${query}"...`);
                    pathEntry.set_sensitive(false);
                    
                    if (query === "") {
                        if (currentDir) pathEntry.set_text(currentDir.get_path());
                        pathEntry.set_sensitive(true);
                        scanDirectory(currentDir, searchCancellable, "");
                    } else {
                        scanDirectory(currentDir, searchCancellable, query, true);
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