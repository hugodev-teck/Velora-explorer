#!/usr/bin/gjs

imports.gi.versions.Gtk = '4.0';
const { Gtk, Gio, GObject, GLib, Gdk } = imports.gi;

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
        const window = new Gtk.ApplicationWindow({
            application: this,
            title: 'Explorer',
            default_width: 1200,
            default_height: 800
        });

        // Le conteneur principal de toute la fenêtre
        const rootBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
        window.set_child(rootBox);

        // ==========================================
        // --- LA BARRE SUPÉRIEURE (Barre d'outils) ---
        // ==========================================
        const topBar = new Gtk.Box({ 
            orientation: Gtk.Orientation.HORIZONTAL, 
            spacing: 8, 
            margin_top: 8, margin_bottom: 8, margin_start: 8, margin_end: 8 
        });
        rootBox.append(topBar);

        // 1. Boutons Précédent / Suivant (Groupés)
        const navGroup = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
        navGroup.add_css_class('linked'); // Astuce GTK : colle les boutons entre eux visuellement

        const btnBack = new Gtk.Button({ icon_name: 'go-previous-symbolic' });
        const btnForward = new Gtk.Button({ icon_name: 'go-next-symbolic' });
        
        // On désactive les boutons au démarrage
        btnBack.set_sensitive(false);
        btnForward.set_sensitive(false);
        
        navGroup.append(btnBack);
        navGroup.append(btnForward);

        // --- LES VARIABLES D'HISTORIQUE ---
        this.historyBack = [];
        this.historyForward = [];
        this.navCancellable = new Gio.Cancellable();
        
        topBar.append(navGroup);

        // 2. Bouton Actualiser
        const btnRefresh = new Gtk.Button({ icon_name: 'view-refresh-symbolic' });
        topBar.append(btnRefresh);

        // 3. Barre d'adresse (Chemin)
        // On utilise un Gtk.Entry (champ texte) pour pouvoir copier/coller un chemin plus tard
        const pathEntry = new Gtk.Entry({ 
            hexpand: true, // Prend tout l'espace vide disponible au centre
            placeholder_text: "Chemin d'accès..." 
        });
        topBar.append(pathEntry);

        // 4. Barre de recherche
        // Gtk.SearchEntry est un widget natif optimisé pour ça (icône loupe intégrée)
        const searchEntry = new Gtk.SearchEntry({ 
            placeholder_text: "Rechercher...",
            width_request: 200 // Largeur fixe pour ne pas écraser la barre d'adresse
        });
        topBar.append(searchEntry);


        // ==========================================
        // --- LE CORPS DE L'EXPLORATEUR (Paned) ---
        // ==========================================
        const paned = new Gtk.Paned({ vexpand: true }); // vexpand: true pour prendre tout l'espace sous la barre
        rootBox.append(paned);

        // --- ZONE GAUCHE : L'Hybride (Raccourcis fixes + Arbre Système) ---
        
        // Le conteneur principal de la colonne de gauche
        const leftBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
        paned.set_start_child(leftBox);
        paned.set_position(250);

        // 1. LES RACCOURCIS FIXES (En haut)
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

        // Raccourcis utilisateur
        addSidebarItem('user-home-symbolic', 'Accueil', GLib.get_home_dir());
        addSidebarItem('user-desktop-symbolic', 'Bureau', GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DESKTOP));
        addSidebarItem('folder-documents-symbolic', 'Documents', GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DOCUMENTS));
        addSidebarItem('folder-download-symbolic', 'Téléchargements', GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DOWNLOAD));
        addSidebarItem('folder-music-symbolic', 'Musiques', GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_MUSIC));
        addSidebarItem('folder-pictures-symbolic', 'Images', GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PICTURES));
        addSidebarItem('folder-videos-symbolic', 'Vidéos', GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_VIDEOS));
        
        // Séparateur
        leftBox.append(new Gtk.Separator({ margin_top: 5, margin_bottom: 5 }));

        // 2. L'ARBORESCENCE DÉPLIABLE (Système et Clés USB, en bas)
        // On lui met son propre ScrolledWindow pour que l'arbre puisse défiler indépendamment
        const treeScroll = new Gtk.ScrolledWindow({ hexpand: true, vexpand: true });
        leftBox.append(treeScroll);

        const treeRootStore = new Gio.ListStore({ item_type: Gio.File });
        // Ajout du disque principal Linux
        treeRootStore.append(Gio.File.new_for_path('/'));

        // Ajout dynamique des lecteurs amovibles / réseau
        const volumeMonitor = Gio.VolumeMonitor.get();
        const mounts = volumeMonitor.get_mounts();
        for (let mount of mounts) {
            treeRootStore.append(mount.get_root());
        }

        // Le moteur de l'arbre (Lazy Loading)
        const treeModel = Gtk.TreeListModel.new(treeRootStore, false, false, (file) => {
            const info = file.query_info('standard::type', Gio.FileQueryInfoFlags.NONE, null);
            if (info.get_file_type() !== Gio.FileType.DIRECTORY) return null;

            const childStore = new Gio.ListStore({ item_type: Gio.File });
            file.enumerate_children_async('standard::name', Gio.FileQueryInfoFlags.NONE, GLib.PRIORITY_DEFAULT, null, (sourceObj, res) => {
                try {
                    const enumerator = sourceObj.enumerate_children_finish(res);
                    const getNextBatch = () => {
                        enumerator.next_files_async(50, GLib.PRIORITY_DEFAULT, null, (enumObj, enumRes) => {
                            const files = enumObj.next_files_finish(enumRes);
                            if (files.length > 0) {
                                for (let f of files) childStore.append(sourceObj.get_child(f.get_name()));
                                getNextBatch();
                            } else {
                                enumerator.close_async(GLib.PRIORITY_DEFAULT, null, null);
                            }
                        });
                    };
                    getNextBatch();
                } catch (e) {} // Ignore les dossiers sans permissions
            });
            return childStore;
        });

        const treeSelection = new Gtk.SingleSelection({ model: treeModel });
        const treeFactory = new Gtk.SignalListItemFactory();
        
        treeFactory.connect('setup', (factory, listItem) => {
            const expander = new Gtk.TreeExpander();
            // On prépare une boîte avec Icône + Texte pour l'arbre
            const box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 5 });
            box.append(new Gtk.Image()); 
            box.append(new Gtk.Label({ xalign: 0, margin_top: 2, margin_bottom: 2 }));
            expander.set_child(box);
            listItem.set_child(expander);
        });

        treeFactory.connect('bind', (factory, listItem) => {
            const treeRow = listItem.get_item();
            const file = treeRow.get_item();
            const expander = listItem.get_child();
            expander.set_list_row(treeRow);
            
            const box = expander.get_child();
            const icon = box.get_first_child();
            const label = box.get_last_child();

            // Gestion de l'affichage (Icône + Nom) selon si c'est la racine, une clé ou un dossier
            if (file.get_path() === '/') {
                label.set_text("Système de fichiers");
                icon.set_from_icon_name("drive-harddisk-system-symbolic");
            } else {
                label.set_text(file.get_basename());
                icon.set_from_icon_name("folder-symbolic"); 
                // Note : Pour affiner, on pourrait boucler sur `mounts` pour mettre 
                // l'icône spécifique des clés USB ici.
            }
        });

        const treeView = new Gtk.ListView({ model: treeSelection, factory: treeFactory });
        // On applique le même style CSS pour que la liste et l'arbre aient la même apparence !
        treeView.add_css_class('navigation-sidebar'); 
        treeScroll.set_child(treeView);

        // 3. LES INTERACTIONS
        sidebarList.connect('row-activated', (listbox, row) => {
            if (row.targetPath) loadDirectory(row.targetPath);
            // Optionnel : désélectionner l'arbre quand on clique sur un raccourci
            treeSelection.set_selected(Gtk.INVALID_LIST_POSITION); 
        });

        treeView.connect('activate', (view, position) => {
            const treeRow = treeModel.get_item(position);
            const file = treeRow.get_item();
            loadDirectory(file.get_path());
            // Optionnel : désélectionner les raccourcis quand on navigue dans l'arbre
            sidebarList.unselect_all();
        });

        // --- ZONE DROITE : Barre d'adresse + Liste des fichiers ---
        const rightBox = new Gtk.Box({ 
            orientation: Gtk.Orientation.VERTICAL, 
            margin_top: 10, margin_end: 10, margin_start: 10, spacing: 10 
        });
        paned.set_end_child(rightBox);

        // Le défilement pour la liste (vexpand pour prendre tout l'espace restant)
        const rightScroll = new Gtk.ScrolledWindow({ hexpand: true, vexpand: true });
        paned.set_end_child(rightScroll);
        
        // Variable pour stocker le dossier courant
        this.currentDir = null;

        // 2. LE MODÈLE DE DONNÉES (Le Moteur)
        // C'est ici que GTK4 est puissant : on stocke des objets GFileInfo purs, pas de l'UI.
        this.fileStore = new Gio.ListStore({ item_type: FileItem });
        const selectionModel = new Gtk.MultiSelection({ model: this.fileStore });
        
        const columnView = new Gtk.ColumnView({ model: selectionModel, hexpand: true, vexpand: true });
        columnView.set_enable_rubberband(true);
        rightScroll.set_child(columnView);

        // --- Colonne 1 : Icône + Nom ---
        const nameFactory = new Gtk.SignalListItemFactory();
        nameFactory.connect('setup', (factory, listItem) => {
            const box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 });
            box.append(new Gtk.Image()); // Emplacement pour l'icône
            box.append(new Gtk.Label({ xalign: 0 })); // Emplacement pour le texte
            listItem.set_child(box);
        });

        nameFactory.connect('bind', (factory, listItem) => {
            const fileItem = listItem.get_item(); // On récupère la capsule
            const fileInfo = fileItem.info;       // On sort les infos
            
            const box = listItem.get_child();
            const icon = box.get_first_child();
            const label = box.get_last_child();

            label.set_text(fileInfo.get_name());
            
            const gicon = fileInfo.get_icon();
            if (gicon) {
                icon.set_from_gicon(gicon);
            }
        });

        const nameColumn = new Gtk.ColumnViewColumn({ 
            title: "Nom", 
            factory: nameFactory,
            expand: true 
        });
        columnView.append_column(nameColumn);

        // --- Colonne 2 : Taille ---
        const sizeFactory = new Gtk.SignalListItemFactory();
        sizeFactory.connect('setup', (factory, listItem) => {
            listItem.set_child(new Gtk.Label({ xalign: 1 })); 
        });

        sizeFactory.connect('bind', (factory, listItem) => {
            const fileInfo = listItem.get_item().info; // <-- Utilisation de la capsule
            const label = listItem.get_child();
            
            if (fileInfo.get_file_type() === Gio.FileType.DIRECTORY) {
                label.set_text("--"); 
            } else {
                label.set_text(GLib.format_size(fileInfo.get_size())); 
            }
        });

        const sizeColumn = new Gtk.ColumnViewColumn({ title: "Taille", factory: sizeFactory });
        columnView.append_column(sizeColumn);

        // --- Colonne 3 : Date de modification ---
        const dateFactory = new Gtk.SignalListItemFactory();
        dateFactory.connect('setup', (factory, listItem) => {
            listItem.set_child(new Gtk.Label({ xalign: 0 }));
        });

        dateFactory.connect('bind', (factory, listItem) => {
            const fileInfo = listItem.get_item().info; // <-- Utilisation de la capsule
            const label = listItem.get_child();
            
            const dt = fileInfo.get_modification_date_time();
            if (dt) {
                label.set_text(dt.format("%d/%m/%Y %H:%M")); 
            } else {
                label.set_text("Inconnue");
            }
        });

        const dateColumn = new Gtk.ColumnViewColumn({ title: "Modifié le", factory: dateFactory });
        columnView.append_column(dateColumn);

        // --- Gérer le double-clic (Ouverture) ---
        columnView.connect('activate', (view, position) => {
            const fileItem = this.fileStore.get_item(position);
            const info = fileItem.info;
            const childFile = fileItem.file; // Plus besoin de this.currentDir !

            if (info.get_file_type() === Gio.FileType.DIRECTORY) {
                loadDirectory(childFile.get_path());
            } else {
                // C'est un fichier : on demande au système de l'ouvrir
                try {
                    Gio.AppInfo.launch_default_for_uri(childFile.get_uri(), null);
                } catch (e) {
                    console.error("Pas d'app par défaut : " + e.message);
                    
                    // --- GESTION DE L'ERREUR : On ouvre le sélecteur d'applications natif ---
                    const appChooser = new Gtk.AppChooserDialog({
                        transient_for: window,
                        modal: true,
                        gfile: childFile // Le fichier cible
                    });

                    appChooser.set_heading("Choisir une application pour ouvrir ce fichier");

                    // Quand l'utilisateur clique sur "Sélectionner" ou "Annuler"
                    appChooser.connect('response', (dialog, response_id) => {
                        if (response_id === Gtk.ResponseType.OK) {
                            const appInfo = dialog.get_app_info();
                            if (appInfo) {
                                try {
                                    // On force le lancement avec l'application choisie
                                    appInfo.launch([childFile], null);
                                } catch (launchErr) {
                                    console.error("Échec du lancement forcé : " + launchErr.message);
                                }
                            }
                        }
                        dialog.destroy(); // On ferme la fenêtre proprement
                    });

                    appChooser.present(); // On affiche la fenêtre
                }
            }
        });

        this.clipboard = { action: null, files: [] };

        const dummyAction = new Gio.SimpleAction({ name: 'menu-action' });
        dummyAction.connect('activate', () => console.log("Action du menu cliquée !"));
        window.add_action(dummyAction); // On attache l'action à la fenêtre

        const propertiesAction = new Gio.SimpleAction({ name: 'properties' });
        propertiesAction.connect('activate', () => {
            const selectedFiles = getSelectedFiles();
            
            // On vérifie qu'il n'y a qu'un seul élément
            if (selectedFiles.length === 1) {
                // selectedFiles est un tableau, on passe le premier (et unique) élément [0]
                openPropertiesWindow(selectedFiles[0]); 
            }
        });
        window.add_action(propertiesAction);

        const copyAction = new Gio.SimpleAction({ name: 'copy' });
        copyAction.connect('activate', () => {
            const selectedFiles = getSelectedFiles();
            if (selectedFiles.length > 0) {
                this.clipboard.action = 'copy';
                // On transforme les informations de la liste en véritables objets Gio.File
                this.clipboard.files = selectedFiles.map(item => item.file);
                console.log(`${selectedFiles.length} fichier(s) prêt(s) à être copié(s).`);
            }
        });
        window.add_action(copyAction);

        // ACTION : COUPER
        const cutAction = new Gio.SimpleAction({ name: 'cut' });
        cutAction.connect('activate', () => {
            const selectedFiles = getSelectedFiles();
            if (selectedFiles.length > 0) {
                this.clipboard.action = 'cut';
                this.clipboard.files = selectedFiles.map(item => item.file);
                console.log(`${selectedFiles.length} fichier(s) prêt(s) à être coupé(s).`);
            }
        });
        window.add_action(cutAction);

        const pasteAction = new Gio.SimpleAction({ name: 'paste' });
        pasteAction.connect('activate', () => {
            if (this.clipboard.files && this.clipboard.files.length > 0 && this.currentDir) {
                console.log(`Lancement du collage de ${this.clipboard.files.length} élément(s)...`);

                // On prépare la fonction de succès globale
                const onSuccess = () => {
                    console.log("Opérations terminées !");
                    loadDirectory(this.currentDir.get_path(), false); // Rafraîchit l'explorateur
                    if (this.clipboard.action === 'cut') {
                        this.clipboard = { action: null, files: [] }; // Vide le presse-papiers si coupé
                    }
                };

                const onError = (err) => console.error(err.message);

                // On envoie le tableau entier d'un seul coup !
                if (this.clipboard.action === 'copy') {
                    FileOps.copy(this.clipboard.files, this.currentDir, onSuccess, onError);
                } else if (this.clipboard.action === 'cut') {
                    FileOps.move(this.clipboard.files, this.currentDir, onSuccess, onError);
                }
            }
        });
        window.add_action(pasteAction);

        // ACTION : SUPPRIMER (Utilise FileOps)
        const deleteAction = new Gio.SimpleAction({ name: 'delete' });
        deleteAction.connect('activate', () => {
            const selectedFiles = getSelectedFiles();
            
            if (selectedFiles.length > 0) {
                console.log(`Mise à la corbeille de ${selectedFiles.length} élément(s)...`);
                
                // On transforme la sélection en tableau d'objets Gio.File
                const filesToTrash = selectedFiles.map(item => item.file);
                
                // On envoie LE TABLEAU ENTIER à FileOps (qui va gérer sa propre fenêtre globale)
                FileOps.trash(filesToTrash, 
                    () => loadDirectory(this.currentDir.get_path(), false),
                    (err) => console.error(err.message)
                );
            }
        });
        window.add_action(deleteAction);

        // --- Le conteneur visuel du menu contextuel ---
        const contextMenu = new Gtk.PopoverMenu({ has_arrow: false });
        contextMenu.set_parent(columnView); // Le menu "appartient" à la vue des fichiers

        // --- Le détecteur de clics ---
        const rightClickGesture = new Gtk.GestureClick({ button: 3 }); // 3 = Clic droit
        columnView.add_controller(rightClickGesture);

        rightClickGesture.connect('pressed', (gesture, n_press, x, y) => {
            // 1. On crée un nouveau modèle de menu vide
            const menu = new Gio.Menu();

            // 2. On vérifie si un fichier est actuellement sélectionné
            // (selectionModel.get_selected_item() renvoie un GFileInfo ou null)
            const selectedFiles = getSelectedFiles();

            if (selectedFiles.length > 0) {
                // Un élément est sélectionné ! On ajoute le bloc d'ouverture
                const openSection = new Gio.Menu();
                // "win.menu-action" fait appel à notre action factice créée plus haut
                openSection.append("Ouvrir", "win.menu-action"); 
                openSection.append("Ouvrir avec...", "win.menu-action");
                
                // On ajoute cette section tout en haut du menu global
                menu.append_section(null, openSection);

                const editSection = new Gio.Menu();
                editSection.append("Couper", "win.cut");
                editSection.append("Copier", "win.copy");
                editSection.append("Supprimer", "win.delete");
                menu.append_section(null, editSection);
            }

            if (this.clipboard && this.clipboard.files && this.clipboard.files.length > 0) {
                const pasteSection = new Gio.Menu();
                // Bonus : On affiche le nombre d'éléments à coller !
                pasteSection.append(`Coller (${this.clipboard.files.length})`, "win.paste");
                menu.append_section(null, pasteSection);
            }

            // 3. Les listes à choix (Sous-menus)
            const affichageMenu = new Gio.Menu();
            affichageMenu.append("Grandes icônes", "win.menu-action");
            affichageMenu.append("Liste", "win.menu-action");
            menu.append_submenu("Affichage", affichageMenu);

            const trierMenu = new Gio.Menu();
            trierMenu.append("Par nom", "win.menu-action");
            trierMenu.append("Par date", "win.menu-action");
            menu.append_submenu("Trier par", trierMenu);

            const regrouperMenu = new Gio.Menu();
            regrouperMenu.append("Aucun", "win.menu-action");
            menu.append_submenu("Regrouper par", regrouperMenu);

            // 4. Les boutons classiques (Dans une section séparée pour avoir une petite ligne de démarcation)
            const actionSection = new Gio.Menu();
            
            // On transforme "Nouveau" en un sous-menu avec deux choix
            const newMenu = new Gio.Menu();
            newMenu.append("Dossier", "win.new-folder");
            newMenu.append("Document texte", "win.new-file");
            
            actionSection.append_submenu("Nouveau", newMenu);
            if (selectedFiles.length == 1) {
                actionSection.append("Propriétés", "win.properties");
            }
            menu.append_section(null, actionSection);

            // 5. On affiche le menu là où la souris a cliqué
            contextMenu.set_menu_model(menu);
            contextMenu.set_pointing_to(new Gdk.Rectangle({ x: x, y: y, width: 1, height: 1.5 }));
            contextMenu.popup();
        });

        const promptNewName = (title, defaultName, onConfirm) => {
            const dialog = new Gtk.Window({
                transient_for: window,
                modal: true,
                title: title,
                default_width: 300,
                resizable: false
            });

            const box = new Gtk.Box({ 
                orientation: Gtk.Orientation.VERTICAL, 
                spacing: 12, margin_top: 15, margin_bottom: 15, margin_start: 15, margin_end: 15 
            });
            dialog.set_child(box);

            const entry = new Gtk.Entry({ text: defaultName });
            box.append(entry);

            const btnBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, halign: Gtk.Align.END });
            const btnCancel = new Gtk.Button({ label: "Annuler" });
            const btnCreate = new Gtk.Button({ label: "Créer" });
            
            btnBox.append(btnCancel);
            btnBox.append(btnCreate);
            box.append(btnBox);

            btnCancel.connect('clicked', () => dialog.close());
            
            const confirm = () => {
                const name = entry.get_text().trim();
                if (name !== "") {
                    onConfirm(name);
                    dialog.close();
                }
            };
            
            btnCreate.connect('clicked', confirm);
            entry.connect('activate', confirm); // Valide quand on appuie sur Entrée

            dialog.present();
        };

        // ACTION : NOUVEAU DOSSIER
        const newFolderAction = new Gio.SimpleAction({ name: 'new-folder' });
        newFolderAction.connect('activate', () => {
            if (!this.currentDir) return;
            promptNewName("Nouveau dossier", "Nouveau dossier", (name) => {
                FileOps.mkdir(this.currentDir, name, 
                    () => loadDirectory(this.currentDir.get_path(), false),
                    (err) => console.error("Erreur création dossier : " + err.message)
                );
            });
        });
        window.add_action(newFolderAction);

        // ACTION : NOUVEAU FICHIER
        const newFileAction = new Gio.SimpleAction({ name: 'new-file' });
        newFileAction.connect('activate', () => {
            if (!this.currentDir) return;
            promptNewName("Nouveau fichier", "Nouveau document.txt", (name) => {
                FileOps.mkfile(this.currentDir, name, 
                    () => loadDirectory(this.currentDir.get_path(), false),
                    (err) => console.error("Erreur création fichier : " + err.message)
                );
            });
        });
        window.add_action(newFileAction);

        const openPropertiesWindow = (fileItem) => {
            // 1. On extrait les données de notre nouvelle capsule !
            const fileInfo = fileItem.info;
            const childFile = fileItem.file; // On utilise le chemin absolu direct
            
            const fileName = fileInfo.get_name();
            
            // On interroge le fichier en direct pour récupérer l'exhaustivité des informations
            // (tailles réelles, dates d'accès et de création, type détaillé)
            let fullInfo;
            try {
                fullInfo = childFile.query_info('standard::*,time::*', Gio.FileQueryInfoFlags.NONE, null);
            } catch(e) {
                fullInfo = fileInfo; // Sécurité au cas où le fichier serait bloqué
            }

            const propWin = new Gtk.Window({
                transient_for: window,
                destroy_with_parent: true,
                title: "Propriétés de " + fileName,
                default_width: 380,
                default_height: 480,
                modal: false
            });

            // Système d'onglets
            const notebook = new Gtk.Notebook();
            propWin.set_child(notebook);

            // --- L'onglet "Général" ---
            const generalBox = new Gtk.Box({ 
                orientation: Gtk.Orientation.VERTICAL, 
                spacing: 12, margin_top: 15, margin_bottom: 15, margin_start: 15, margin_end: 15 
            });
            notebook.append_page(generalBox, new Gtk.Label({ label: "Général" }));

            // 1. En-tête : Icône + Zone de texte modifiable
            const headerBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 15 });
            const iconImage = new Gtk.Image({ pixel_size: 64 });
            const gicon = fullInfo.get_icon();
            if (gicon) iconImage.set_from_gicon(gicon);
            
            const nameEntry = new Gtk.Entry({ text: fileName, hexpand: true, valign: Gtk.Align.CENTER });
            headerBox.append(iconImage);
            headerBox.append(nameEntry);
            generalBox.append(headerBox);

            generalBox.append(new Gtk.Separator({ margin_top: 5, margin_bottom: 5 }));

            // 2. Grille d'informations système (Type, Emplacement, Tailles)
            const grid1 = new Gtk.Grid({ column_spacing: 30, row_spacing: 8 });
            generalBox.append(grid1);

            let row1 = 0;
            const addInfo1 = (labelStr, valueStr) => {
                grid1.attach(new Gtk.Label({ label: labelStr + " :", xalign: 0 }), 0, row1, 1, 1);
                grid1.attach(new Gtk.Label({ label: valueStr, xalign: 0, selectable: true }), 1, row1, 1, 1);
                row1++;
            };

            const isDir = fullInfo.get_file_type() === Gio.FileType.DIRECTORY;
            
            // Détection précise du type
            let typeString = "Dossier de fichiers";
            if (!isDir) {
                const contentType = fullInfo.get_content_type();
                // Gio.content_type_get_description traduit le type MIME en texte lisible (ex: "Document PDF")
                typeString = contentType ? Gio.content_type_get_description(contentType) : "Fichier";
            }
            
            addInfo1("Type", typeString);
            addInfo1("Emplacement", this.currentDir.get_path());
            
            // On n'affiche la taille que si c'est un fichier
            if (!isDir) {
                const size = fullInfo.get_size();
                const allocatedSize = fullInfo.get_attribute_uint64('standard::allocated-size');
                
                // Formatage à la Windows : "1,2 Mo (1234567 octets)"
                addInfo1("Taille", `${GLib.format_size(size)} (${size} octets)`);
                addInfo1("Taille sur le disque", `${GLib.format_size(allocatedSize)} (${allocatedSize} octets)`);
            }

            generalBox.append(new Gtk.Separator({ margin_top: 5, margin_bottom: 5 }));

            // 3. Grille des dates (Création, Modification, Accès)
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

            // 4. Boutons d'action (OK et Appliquer)
            const btnBox = new Gtk.Box({ 
                orientation: Gtk.Orientation.HORIZONTAL, 
                spacing: 10, halign: Gtk.Align.END, margin_top: 10 
            });
            const btnOk = new Gtk.Button({ label: "OK", width_request: 80 });
            const btnApply = new Gtk.Button({ label: "Appliquer", width_request: 80 });
            
            // Logique de renommage réutilisable pour les deux boutons
            const applyRename = (closeAfter = false) => {
                const newName = nameEntry.get_text();
                
                // Si le nom est vide ou s'il n'a pas changé, on ferme juste (si demandé)
                if (newName.trim() === "" || newName === fileName) {
                    if (closeAfter) propWin.close();
                    return;
                }

                // On désactive les boutons pendant le travail du disque (pour éviter le spam clic)
                btnOk.set_sensitive(false);
                btnApply.set_sensitive(false);
                nameEntry.set_sensitive(false);

                // Appel de notre fonction générale !
                FileOps.rename(childFile, newName, 
                    // CALLBACK SUCCÈS
                    (newFile) => {
                        console.log("Fichier renommé en : " + newFile.get_basename());
                        // On actualise la liste principale en arrière-plan
                        loadDirectory(this.currentDir.get_path(), false);
                        
                        if (closeAfter) {
                            propWin.close();
                        } else {
                            // On réactive l'UI si on garde la fenêtre ouverte
                            btnOk.set_sensitive(true);
                            btnApply.set_sensitive(true);
                            nameEntry.set_sensitive(true);
                            // Idéalement, il faudrait aussi mettre à jour la variable fileName ici 
                            // pour que les prochains clics vérifient par rapport au nouveau nom.
                        }
                    },
                    // CALLBACK ERREUR
                    (err) => {
                        console.error("Impossible de renommer : " + err.message);
                        // On réactive l'UI pour laisser l'utilisateur réessayer
                        btnOk.set_sensitive(true);
                        btnApply.set_sensitive(true);
                        nameEntry.set_sensitive(true);
                        // Bonus : Tu pourrais ajouter ici un petit label rouge dans la fenêtre pour prévenir l'utilisateur
                    }
                );
            };

            // Le bouton OK applique et ferme
            btnOk.connect('clicked', () => propWin.close());
            
            // Le bouton Appliquer applique mais laisse la fenêtre ouverte
            btnApply.connect('clicked', () => applyRename(false));
            
            btnBox.append(btnOk);
            btnBox.append(btnApply);
            generalBox.append(btnBox);

            propWin.present();
        };

        // ==========================================
        // --- MOTEUR D'OPÉRATIONS FICHIERS (GIO) ---
        // ==========================================
        const FileOps = {
            // Fonction utilitaire interne pour générer la fenêtre de progression
            _showProgress: (title, fileName, hasProgress, operationCallback) => {
                const cancellable = new Gio.Cancellable();

                // Création de la fenêtre volante
                const progWin = new Gtk.Window({
                    transient_for: window, // Attachée à la fenêtre principale
                    modal: false,          // Bloque le clic ailleurs pendant l'opération
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

                // Bouton Annuler
                const cancelBtn = new Gtk.Button({ label: "Annuler", halign: Gtk.Align.END });
                cancelBtn.connect('clicked', () => {
                    cancellable.cancel(); // Stoppe l'opération GIO instantanément !
                    cancelBtn.set_sensitive(false);
                    label.set_text("Annulation en cours...");
                });
                box.append(cancelBtn);

                progWin.present();

                // Si l'opération ne renvoie pas de progression (ex: Supprimer), on fait pulser la barre
                let pulseId = 0;
                if (!hasProgress) {
                    pulseId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
                        progressBar.pulse();
                        return GLib.SOURCE_CONTINUE;
                    });
                }

                // --- L'attente de 500ms demandée ---
                GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
                    if (cancellable.is_cancelled()) {
                        if (pulseId) GLib.Source.remove(pulseId);
                        progWin.close();
                        return GLib.SOURCE_REMOVE;
                    }

                    // Fonction utilitaire pour changer le texte depuis l'extérieur
                    const updateLabel = (text) => label.set_text(text);

                    // On lance la vraie opération GIO
                    operationCallback(
                        cancellable,
                        // Le callback de progression
                        (current, total) => {
                            if (total > 0) progressBar.set_fraction(current / total);
                        },
                        // Le callback de fermeture
                        () => {
                            if (pulseId) GLib.Source.remove(pulseId);
                            progWin.close();
                        },
                        updateLabel // <-- NOUVEAU : On passe la fonction pour changer le texte !
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

            // --- NOUVEAU FICHIER VIDE ---
            mkfile: (parentDir, name, onSuccess, onError) => {
                const newFile = parentDir.get_child(name);
                newFile.create_async(Gio.FileCreateFlags.NONE, GLib.PRIORITY_DEFAULT, null, (source, res) => {
                    try {
                        const outputStream = source.create_finish(res);
                        // On ferme immédiatement le flux d'écriture pour libérer le fichier
                        outputStream.close_async(GLib.PRIORITY_DEFAULT, null, () => {
                            if (onSuccess) onSuccess();
                        });
                    } catch (e) {
                        if (onError) onError(e);
                    }
                });
            },
            

            // --- RENOMMER (Rapide, pas besoin de fenêtre de progression) ---
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

            // --- COPIER (Avec fenêtre et barre de progression) ---
            copy: (sources, destDir, onSuccess, onError) => {
                const srcArray = Array.isArray(sources) ? sources : [sources];
                if (srcArray.length === 0) {
                    if (onSuccess) onSuccess();
                    return;
                }

                FileOps._showProgress("Copie en cours", "Préparation...", true, (cancellable, progressCb, closeWin, updateLabel) => {
                    let currentIndex = 0;

                    // Fonction qui traite l'élément principal suivant du presse-papiers
                    const processNextRoot = () => {
                        if (cancellable.is_cancelled() || currentIndex >= srcArray.length) {
                            closeWin();
                            if (onSuccess && currentIndex >= srcArray.length) onSuccess();
                            return;
                        }

                        const src = srcArray[currentIndex];
                        const dst = destDir.get_child(src.get_basename());

                        // Fonction récursive pour lire l'intérieur des dossiers
                        const copyRecursive = (currentSrc, currentDst, cb) => {
                            if (cancellable.is_cancelled()) { cb(new Error("Annulé")); return; }
                            
                            // MAGIE : Le texte de la fenêtre s'actualise avec le fichier exact en cours !
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
                                                            cb(); // Sous-dossier terminé
                                                        }
                                                    });
                                                };
                                                processNextChild();
                                            });
                                        });
                                    } else {
                                        // C'est un fichier : la barre se remplit en direct pour lui
                                        currentSrc.copy_async(currentDst, Gio.FileCopyFlags.NONE, GLib.PRIORITY_DEFAULT, cancellable, progressCb, (cSrc, cRes) => {
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

                    processNextRoot(); // On lance la machine
                });
            },

            // --- COUPER / DÉPLACER (Avec fenêtre et barre de progression) ---
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
                        
                        updateLabel(`Déplacement : ${src.get_basename()}`);
                        
                        // Sur un même disque, move_async déplace instantanément un dossier (c'est un renommage)
                        src.move_async(dst, Gio.FileCopyFlags.NONE, GLib.PRIORITY_DEFAULT, cancellable, progressCb, (s, res) => {
                            try { s.move_finish(res); } catch(e) { console.warn(e.message); }
                            currentIndex++;
                            processNext();
                        });
                    };
                    processNext();
                });
            },

            trash: (files, onSuccess, onError) => {
                // On s'assure d'avoir un tableau
                const fileArray = Array.isArray(files) ? files : [files];
                const total = fileArray.length;
                
                if (total === 0) {
                    if (onSuccess) onSuccess();
                    return;
                }

                // On active "hasProgress" (true) pour avoir une vraie barre qui se remplit
                FileOps._showProgress("Mise à la corbeille", fileArray[0].get_basename(), true, (cancellable, progressCb, closeWin, updateLabel) => {
                    let currentIndex = 0;

                    // Boucle asynchrone qui traite un fichier à la fois
                    const trashNext = () => {
                        // 1. Vérifier si l'utilisateur a cliqué sur "Annuler"
                        if (cancellable.is_cancelled()) {
                            closeWin();
                            console.log("Suppression annulée par l'utilisateur.");
                            return;
                        }

                        // 2. Vérifier si on a fini tout le tableau
                        if (currentIndex >= total) {
                            closeWin();
                            if (onSuccess) onSuccess();
                            return;
                        }

                        const currentFile = fileArray[currentIndex];
                        
                        // 3. Mise à jour du texte avec le fichier EN COURS
                        updateLabel(`Suppression de : ${currentFile.get_basename()} (${currentIndex + 1}/${total})`);
                        
                        // 4. Mise à jour de la barre globale
                        progressCb(currentIndex, total);

                        // 5. Lancement de la suppression pour ce fichier précis
                        currentFile.trash_async(GLib.PRIORITY_DEFAULT, cancellable, (source, res) => {
                            try {
                                source.trash_finish(res);
                            } catch (e) {
                                console.warn(`Erreur sur ${currentFile.get_basename()}: ${e.message}`);
                                // (On continue la boucle même s'il y a une erreur sur un fichier)
                            }
                            
                            currentIndex++;
                            progressCb(currentIndex, total); // Remplit la jauge
                            
                            trashNext(); // On passe au fichier suivant !
                        });
                    };

                    // Démarrage de la boucle
                    trashNext();
                });
            }
        };

        const getSelectedFiles = () => {
            const bitset = selectionModel.get_selection();
            const files = [];
            // On boucle sur la taille de la liste VISIBLE (filtrée)
            for (let i = 0; i < selectionModel.get_n_items(); i++) {
                if (bitset.contains(i)) {
                    // On récupère l'élément depuis le modèle filtré
                    files.push(selectionModel.get_item(i));
                }
            }
            return files;
        };

        // --- 4. LA FONCTION GIO ASYNCHRONE ---
       // --- 4. LA FONCTION GIO ASYNCHRONE (SÉCURISÉE) ---
        const loadDirectory = (path, recordHistory = true) => {
            this.navCancellable.cancel();
            this.navCancellable = new Gio.Cancellable();

            if (recordHistory && this.currentDir) {
                const currentPath = this.currentDir.get_path();
                if (currentPath !== path) {
                    this.historyBack.push(currentPath);
                    this.historyForward = [];
                }
            }

            this.fileStore.remove_all(); 
            this.currentDir = Gio.File.new_for_path(path); 
            pathEntry.set_text(path); 
            searchEntry.set_text(""); // Vide la recherche au changement de dossier
            
            btnBack.set_sensitive(this.historyBack.length > 0);
            btnForward.set_sensitive(this.historyForward.length > 0);

            // On lance un scan local classique
            scanDirectory(this.currentDir, this.navCancellable, "");
        };

        // Fonction utilitaire de scan (Réutilisable pour la recherche)
        const scanDirectory = (dirObj, cancellable, searchQuery, isRecursive = false) => {
            dirObj.enumerate_children_async(
                'standard::name,standard::type,standard::icon,standard::size,time::modified', 
                Gio.FileQueryInfoFlags.NONE,
                GLib.PRIORITY_DEFAULT,
                cancellable, 
                (sourceObj, res) => {
                    try {
                        const enumerator = sourceObj.enumerate_children_finish(res);
                        
                        const getNextBatch = () => {
                            enumerator.next_files_async(50, GLib.PRIORITY_DEFAULT, cancellable, (enumObj, enumRes) => {
                                try {
                                    const files = enumObj.next_files_finish(enumRes);
                                    if (files.length > 0) {
                                        for (let info of files) {
                                            if (!info.get_name().startsWith('.')) {
                                                const childFile = sourceObj.get_child(info.get_name());
                                                
                                                // Si pas de recherche, ou si ça correspond
                                                if (searchQuery === "" || info.get_name().toLowerCase().includes(searchQuery)) {
                                                    // On utilise notre nouvelle capsule FileItem !
                                                    this.fileStore.append(new FileItem({ info: info, file: childFile }));
                                                }

                                                // Si c'est un dossier et qu'on est en recherche récursive, on plonge dedans !
                                                if (isRecursive && info.get_file_type() === Gio.FileType.DIRECTORY) {
                                                    scanDirectory(childFile, cancellable, searchQuery, true);
                                                }
                                            }
                                        }
                                        getNextBatch(); 
                                    } else {
                                        enumerator.close_async(GLib.PRIORITY_DEFAULT, null, null);
                                    }
                                } catch (e) { }
                            });
                        };
                        getNextBatch();
                    } catch (e) { }
                }
            );
        };

        // --- LE MOTEUR DE RECHERCHE RÉCURSIF ---
        let searchTimeoutId = null;
        let searchCancellable = new Gio.Cancellable();

        searchEntry.connect('search-changed', () => {
            const query = searchEntry.get_text().toLowerCase();
            
            if (searchTimeoutId) GLib.Source.remove(searchTimeoutId);
            
            searchTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 400, () => {
                searchTimeoutId = null;
                
                searchCancellable.cancel(); // Annule la recherche précédente
                searchCancellable = new Gio.Cancellable();
                
                this.fileStore.remove_all(); // On vide l'affichage

                pathEntry.set_text(`Recherche de "${query}"...`);
                pathEntry.set_sensitive(false);
                
                if (query === "") {
                    // Fin de la recherche : on remet le vrai chemin et on déverrouille la barre
                    if (this.currentDir) pathEntry.set_text(this.currentDir.get_path());
                    pathEntry.set_sensitive(true);

                    // On relance un scan local
                    scanDirectory(this.currentDir, searchCancellable, "");
                } else {
                    // On lance un scan RÉCURSIF (true) à partir du dossier courant
                    scanDirectory(this.currentDir, searchCancellable, query, true);
                }
                return GLib.SOURCE_REMOVE;
            });
        });

        // Le bouton actualiser relance simplement la lecture du dossier courant
        btnRefresh.connect('clicked', () => {
            if (this.currentDir) {
                loadDirectory(this.currentDir.get_path());
            }
        });

        btnBack.connect('clicked', () => {
            if (this.historyBack.length > 0) {
                const prevPath = this.historyBack.pop(); // On récupère et retire le dernier chemin
                this.historyForward.push(this.currentDir.get_path()); // On stocke l'actuel dans "Suivant"
                
                loadDirectory(prevPath, false); // false = ne pas l'ajouter à nouveau dans l'historique
            }
        });

        // Action du bouton Suivant (Forward)
        btnForward.connect('clicked', () => {
            if (this.historyForward.length > 0) {
                const nextPath = this.historyForward.pop();
                this.historyBack.push(this.currentDir.get_path()); // On le remet dans "Précédent"
                
                loadDirectory(nextPath, false);
            }
        });

        // Validation manuelle d'un chemin tapé dans la barre d'adresse
        pathEntry.connect('activate', () => {
            const newPath = pathEntry.get_text();
            loadDirectory(newPath);
        });

        // --- NETTOYAGE DE LA MÉMOIRE AVANT FERMETURE ---
        window.connect('close-request', () => {
            if (contextMenu) {
                contextMenu.unparent(); // On détache le menu proprement
            }
            return false; // On renvoie false pour autoriser la fenêtre à se fermer
        });

        // Copier : Ctrl + C
        this.set_accels_for_action('win.copy', ['<Ctrl>c']);
        
        // Couper : Ctrl + X
        this.set_accels_for_action('win.cut', ['<Ctrl>x']);
        
        // Coller : Ctrl + V
        this.set_accels_for_action('win.paste', ['<Ctrl>v']);
        
        // Supprimer : Touche Suppr (Delete)
        this.set_accels_for_action('win.delete', ['Delete']);
        
        // Propriétés : Alt + Entrée (Standard sur la plupart des OS)
        this.set_accels_for_action('win.properties', ['<Alt>Return']);

        // Chargement initial
        loadDirectory(GLib.get_home_dir());
        window.present();
    }
});

const app = new App();
app.run([imports.system.programInvocationName].concat(ARGV));