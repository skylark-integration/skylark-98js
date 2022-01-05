/**
 * skylark-98js - A version of 98js.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-98js/
 * @license MIT
 */
(function(factory,globals) {
  var define = globals.define,
      require = globals.require,
      isAmd = (typeof define === 'function' && define.amd),
      isCmd = (!isAmd && typeof exports !== 'undefined');

  if (!isAmd && !define) {
    var map = {};
    function absolute(relative, base) {
        if (relative[0]!==".") {
          return relative;
        }
        var stack = base.split("/"),
            parts = relative.split("/");
        stack.pop(); 
        for (var i=0; i<parts.length; i++) {
            if (parts[i] == ".")
                continue;
            if (parts[i] == "..")
                stack.pop();
            else
                stack.push(parts[i]);
        }
        return stack.join("/");
    }
    define = globals.define = function(id, deps, factory) {
        if (typeof factory == 'function') {
            map[id] = {
                factory: factory,
                deps: deps.map(function(dep){
                  return absolute(dep,id);
                }),
                resolved: false,
                exports: null
            };
            require(id);
        } else {
            map[id] = {
                factory : null,
                resolved : true,
                exports : factory
            };
        }
    };
    require = globals.require = function(id) {
        if (!map.hasOwnProperty(id)) {
            throw new Error('Module ' + id + ' has not been defined');
        }
        var module = map[id];
        if (!module.resolved) {
            var args = [];

            module.deps.forEach(function(dep){
                args.push(require(dep));
            })

            module.exports = module.factory.apply(globals, args) || null;
            module.resolved = true;
        }
        return module.exports;
    };
  }
  
  if (!define) {
     throw new Error("The module utility (ex: requirejs or skylark-utils) is not loaded!");
  }

  factory(define,require);

  if (!isAmd) {
    var skylarkjs = require("skylark-langx-ns");

    if (isCmd) {
      module.exports = skylarkjs;
    } else {
      globals.skylarkjs  = skylarkjs;
    }
  }

})(function(define,require) {

define('skylark-98js/win98',[
	"skylark-langx-ns",
	"skylark-jquery"
],function(skylark,$){
	window.$ = $;
	return skylark.attach("intg.win98js");
});
define('skylark-98js/helpers',[
	"skylark-jquery",
	"./win98"
],function($,win98js){
	var TAU =     //////|//////
	          /////     |     /////
	       ///         tau         ///
	     ///     ...--> | <--...     ///
	   ///     -'   one | turn  '-     ///
	  //     .'         |         '.     //
	 //     /           |           \     //
	//     |            | <-..       |     //
	//    |          .->|     \       |    //
	//    |         /   |      |      |    //
	- - - - - - Math.PI + Math.PI - - - - - 0
	//    |         \   |      |      |    //
	//    |          '->|     /       |    //
	//     |            | <-''       |     //
	 //     \           |           /     //
	  //     '.         |         .'     //
	   ///     -.       |       .-     ///
	     ///     '''----|----'''     ///
	       ///          |          ///
	         //////     |     /////
	              //////|//////          C/r;

	var $G = $(window);

	function Cursor(cursor_def) {
		return "url(images/cursors/" + cursor_def[0] + ".png) " +
			cursor_def[1].join(" ") +
			", " + cursor_def[2]
	}

	function E(t) {
		return document.createElement(t);
	}

	var DESKTOP_ICON_SIZE = 32;
	var TASKBAR_ICON_SIZE = 16;
	var TITLEBAR_ICON_SIZE = 16;

	// For Wayback Machine, match URLs like https://web.archive.org/web/20191213113214/https://98.js.org/
	// (also match URLs like https://98.js.org/ because why not)
	const web_server_root_for_icons =
		location.href.match(/98.js.org/) ?
			location.href.match(/.*98.js.org/)[0] + "/" :
			"/";

	function getIconPath(iconID, size) {
		return web_server_root_for_icons + "images/icons/" + iconID + "-" + size + "x" + size + ".png";
	}

	function Canvas(width, height) {
		var new_canvas = E("canvas");
		var new_ctx = new_canvas.getContext("2d");
		new_ctx.imageSmoothingEnabled = false;
		new_ctx.mozImageSmoothingEnabled = false;
		new_ctx.webkitImageSmoothingEnabled = false;
		if (width && height) {
			// new Canvas(width, height)
			new_canvas.width = width;
			new_canvas.height = height;
		} else {
			// new Canvas(image)
			var copy_of = width;
			if (copy_of) {
				new_canvas.width = copy_of.width;
				new_canvas.height = copy_of.height;
				new_ctx.drawImage(copy_of, 0, 0);
			}
		}
		new_canvas.ctx = new_ctx;
		return new_canvas;
	}

	function mustHaveMethods(obj, methodNames) {
		for (const methodName of methodNames) {
			if (typeof obj[methodName] != 'function') {
				console.error("Missing method", methodName, "on object", obj);
				throw new TypeError("missing method " + methodName);
			}
		}
		return true;
	}
	const windowInterfaceMethods = [
		"close",
		"minimize",
		"unminimize",
		// "maximize",
		// "unmaximize",
		"bringToFront", // TODO: maybe setZIndex instead
		"getTitle",
		// "getIconName",
		"getIconAtSize",
		"focus",
		"blur",
		"onFocus",
		"onBlur",
		"onClosed",
	];


	function file_name_from_path(file_path) {
		return file_path.split("\\").pop().split("/").pop();
	}

	function file_extension_from_path(file_path) {
		return (file_path.match(/\.(\w+)$/) || [, ""])[1];
	}
	return {
		Cursor,
		DESKTOP_ICON_SIZE,
		TASKBAR_ICON_SIZE,
		TITLEBAR_ICON_SIZE,
		getIconPath,
		Canvas,
		mustHaveMethods,
		windowInterfaceMethods,
		file_name_from_path,

		file_extension_from_path
	}
});
define('skylark-98js/FolderViewItem',[
	"skylark-jquery",
	"./win98",
	"./helpers"
],function($,win98js,helpers){
    "use strict";

	function FolderViewItem(options) {
		// TODO: rename options to be consistent,
		// like is_folder, is_shortcut, etc.
		// TODO: rename CSS class to folder-view-item, or find a better name
		var $container = $("<div class='desktop-icon' draggable='true' tabindex=-1/>");
		var $icon_wrapper = $("<div class='icon-wrapper'/>").appendTo($container);
		var $selection_effect = $("<div class='selection-effect'/>").appendTo($icon_wrapper);
		var $title = $("<div class='title'/>").text(options.title);
		var $icon;
		$container.append($icon_wrapper, $title);

		// TODO: handle the loading state display in some intentional way

		// TODO: or if set to "web" mode, single click
		// also Enter is currently implemented by triggering dblclick which is awkward
		let single_click_timeout;
		$container.on("dblclick", (event) => {
			if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
				return; // Not true to Windows 98. But in Windows 98 it doesn't do two things, it just does the double click action.
				// At any rate, it feels nice to make Ctrl+click do only one thing (toggling the selection state).
			}
			options.open();
			clearTimeout(single_click_timeout);
		});
		// TODO: allow dragging files out from this folder view to the system file browser, with dataTransfer.setData("DownloadURL", ...)
		// sadly will only work for a single file (unless it secretly supports text/uri-list (either as a separate type or for DownloadURL))
		// also it won't work if I want to do custom drag-and-drop (e.g. repositioning icons)
		// so I have to choose one feature or the other (right?), probably custom drag-and-drop

		$title.on("click", () => {
			if (!$container[0]._was_selected_at_pointerdown) {
				return; // this click is for selecting the item
			}
			// @TODO: if the folder view wasn't focused at pointerdown,
			// don't start rename
			single_click_timeout = setTimeout(() => {
				if ($container.hasClass("selected")) {
					this.start_rename();
				}
			}, 500);
		});

		if (options.shortcut) {
			$container.addClass("shortcut");
		}
		$container[0].dataset.filePath = options.file_path;

		this.element = $container[0];

		this.icons = options.icons;
		this.iconSize = options.iconSize || helpers.DESKTOP_ICON_SIZE;

		this.file_path = options.file_path;
		this.is_system_folder = options.is_system_folder;

		this._update_icon = () => {
			if (this.icons) {
				const $old_icon = $icon;
				const src = this.icons[this.iconSize];
				$icon = $("<img class='icon'/>");
				$icon.attr({
					draggable: false,
					src,
					width: this.iconSize,
					height: this.iconSize,
				});
				$selection_effect[0].style.setProperty("--icon-image", `url("${src}")`);
				if ($old_icon) {
					$old_icon.replaceWith($icon);
				} else {
					$icon_wrapper.prepend($icon);
				}
			} else {
				$icon && $icon.remove();
				$icon = null;
				$selection_effect[0].style.setProperty("--icon-image", "none");
			}
			$icon_wrapper[0].style.setProperty("--icon-size", this.iconSize + "px");
			$icon_wrapper[0].style.setProperty("--shortcut-icon", `url("${helpers.getIconPath("shortcut", this.iconSize)}")`);
		};
		this.setIcons = (new_icons) => {
			this.icons = new_icons;
			this._update_icon();
		};
		this.setIconSize = (new_size) => {
			if (this.iconSize === new_size) {
				return;
			}
			this.iconSize = new_size;
			this._update_icon();
		};
		this._update_icon();

		this.start_rename = () => {
			if (!options.rename) {
				return;
			}
			if ($container.hasClass("renaming")) {
				return;
			}
			$container.addClass("renaming");
			$container.attr("draggable", false);
			const old_title = $title.text();
			// @TODO: auto-size the input box,
			// and wrap to multiple lines
			const $input = $("<input type='text'/>");
			$input.val(old_title);
			$input.on("keydown", (e) => {
				// relying on blur event to trigger the rename,
				// or to reset the input to the old title
				if (e.key === "Enter") {
					$container.focus();
					e.preventDefault();
				} else if (e.key === "Escape") {
					$input.val(old_title);
					$container.focus();
					e.preventDefault();
				}
			});
			$input.on("blur", () => {
				const new_title = $input.val();
				if (new_title.trim() === "") {
					showMessageBox({
						title: "Rename",
						message: "You must type a filename.",
						iconID: "error",
					}).then(() => {
						$input.focus(); // @TODO: why is this needed? it's supposed to refocus the last focused element
						// well I guess it doesn't work for the desktop, just windows
					});
					return;
				}
				$input.remove(); // technically not necessary
				$title.text(new_title);
				$container.removeClass("renaming");
				$container.attr("draggable", true);
				if (new_title !== old_title) {
					// console.log("renaming", this.file_path, "to", new_title);
					options.rename(new_title)
						.catch((error) => {
							$title.text(old_title);
							alert("Failed to rename:\n\n" + error);
						});
				}
			});
			$title.empty().append($input);
			$input[0].focus();
			$input[0].select();
		};
	}

	return FolderViewItem;
});
define('skylark-98js/filesystem-setup',[
	"skylark-jquery",
	"skylark-browserfs",
	"./win98"
],function($,BrowserFS, win98js){

	var __fs_initialized;
	var __fs_errored;
	var __fs_timed_out;
	var __fs_waiting_callbacks = [];


	// For Wayback Machine, match URLs like https://web.archive.org/web/20191213113214/https://98.js.org/
	// (also match URLs like https://98.js.org/ because why not)
	const web_server_root_for_browserfs =
		location.href.match(/98.js.org/) ?
			location.href.match(/.*98.js.org/)[0] + "/" :
			"/";

	BrowserFS.configure({
		fs: "OverlayFS",
		options: {
			writable: {
				fs: "IndexedDB",
				options: {
					storeName: "C:"
				}
			},
			readable: {
				fs: "XmlHttpRequest",
				options: {
					index: web_server_root_for_browserfs + "filesystem-index.json",
					baseUrl: web_server_root_for_browserfs
				}
			}
		}
		// TODO: mount the repo contents at something like C:\98\
		// but other OS stuff from a subfolder of the repo as root (C? HD? hard-drive? disk? OS?)
		// the desktop at something like.. well I guess C:\98\desktop
		// and I could have the default desktop setup in source control there
	}, function (error) {
		if (error) {
			__fs_errored = true;
			if (__fs_waiting_callbacks.length) {
				// TODO: DRY (can probably simplify this logic significantly)
				alert("The filesystem is not available. It failed to initialize.");
			}
			__fs_waiting_callbacks = [];
			// TODO: message box; offer to reset the filesystem
			throw error;
		}
		__fs_initialized = true;
		for (var i = 0; i < __fs_waiting_callbacks.length; i++) {
			__fs_waiting_callbacks[i]();
		}
		__fs_waiting_callbacks = [];
	});

	setTimeout(function () {
		__fs_timed_out = true;
		if (__fs_waiting_callbacks.length) {
			// TODO: DRY (can probably simplify this logic significantly)
			alert("The filesystem is not working.");
		}
		__fs_waiting_callbacks = [];
	}, 5000);

	function withFilesystem(callback) {
		if (__fs_initialized) {
			callback();
		} else if (__fs_errored) {
			alert("The filesystem is not available. It failed to initialize.");
		} else if (__fs_timed_out) {
			alert("The filesystem is not working.");
		} else {
			// wait within a global period of time while it should be configuring (and not show a message box)
			// TODO: hm, maybe a global timeout isn't what we want
			// The desktop should load, regardless of how long it takes.
			// Other operations could fail in a second or more. Depending on the operation.
			__fs_waiting_callbacks.push(callback);
		}
	}
	// TODO: never use alert(); use thematic, non-blocking dialog windows, preferably with warning and error icons
	// I have a show_error_message in jspaint, but with no warning or error icons - as of writing; see https://github.com/1j01/jspaint/issues/84


	return {
		withFilesystem
	}

});
define('skylark-98js/FolderView',[
	"skylark-jquery",
	"skylark-browserfs",
	"./win98",
	"./FolderViewItem",
	"./filesystem-setup",
	"./helpers"
],function($,BrowserFS, win98js,FolderViewItem,FilesystemSetup,helpers){
	const grid_size_x_for_large_icons = 75;
	const grid_size_y_for_large_icons = 75;
	// @TODO: this is supposed to be dynamic based on length of names
	const grid_size_x_for_small_icons = 150;
	const grid_size_y_for_small_icons = 17;

	window.resetAllFolderCustomizations = () => {
		for (let i = 0; i < localStorage.length; i++) {
			if (localStorage.key(i).startsWith("folder-config:")) {
				localStorage.removeItem(localStorage.key(i));
			}
		}
	};

	const icon_size_by_view_mode = {
		LARGE_ICONS: 32,
		SMALL_ICONS: 16,
		DETAILS: 16,
		LIST: 16,
		DESKTOP: 32,
	};

	FolderView.VIEW_MODES = {
		THUMBNAILS: "THUMBNAILS", // hidden until you right click in a folder, go to Properties, and enable thumbnails
		LARGE_ICONS: "LARGE_ICONS", // left to right, then top to bottom
		SMALL_ICONS: "SMALL_ICONS", // left to right, then top to bottom
		DETAILS: "DETAILS", // table view
		LIST: "LIST", // top to bottom, then left to right
		DESKTOP: "DESKTOP", // like Large Icons, but arranged top to bottom before left to right; does not apply to the Desktop folder, only the Desktop itself
	};

	FolderView.SORT_MODES = {
		NAME: "NAME",
		TYPE: "TYPE",
		SIZE: "SIZE",
		DATE: "DATE",
		// there are many other attributes, some for specific types of files/objects
	};

	// TODO: what's the "right" way to do file type / program associations for icons?

	// TODO: get more icons; can extract from shell32.dll, moricons.dll, and other files from a VM
	// also get more file extensions; can find a mime types listing data dump
	// https://github.com/1j01/retrores
	// Note: extensions must be lowercase here. This is used to implement case-insensitive matching.
	var file_extension_icons = {
		txt: "notepad-file",
		md: "notepad-file",
		json: "notepad-file",
		js: "notepad-file",
		css: "notepad-file",
		html: "notepad-file",
		gitattributes: "notepad-file",
		gitignore: "notepad-file",
		png: "image-gif", // "image-png"? nope... (but should it be image-gif or image-wmf?)
		jpg: "image-jpeg",
		jpeg: "image-jpeg",
		gif: "image-gif",
		webp: "image-other",
		bmp: "paint-file",
		tif: "kodak-imaging-file",
		tiff: "kodak-imaging-file",
		// wmf: "image-wmf"? nope (https://en.wikipedia.org/wiki/Windows_Metafile)
		// emf: "image-wmf"? nope
		// wmz: "image-wmf"? nope
		// emz: "image-wmf"? nope
		wav: "sound",
		mp3: "sound", // TODO: show blue video icon, as it's a container format that can contain video
		ogg: "sound", // TODO: probably ditto
		wma: "sound",
		// "doc": "doc"?
		"exe": "task",
		htm: "html",
		html: "html",
		url: "html",
		theme: "themes",
		themepack: "themes",
	};

	// @TODO: maintain less fake naming abstraction
	// base it more on the actual filesystem
	// @TODO: bring system folders, icons, and file associations into one place
	const system_folder_path_to_name = {
		"/": "(C:)", //"My Computer",
		"/my-pictures/": "My Pictures",
		"/my-documents/": "My Documents",
		"/network-neighborhood/": "Network Neighborhood",
		"/desktop/": "Desktop",
		"/programs/": "Program Files",
		"/recycle-bin/": "Recycle Bin",
	};
	const system_folder_name_to_path = Object.fromEntries(
		Object.entries(system_folder_path_to_name).map(([key, value]) => [value, key])
	);
	const system_folder_lowercase_name_to_path = Object.fromEntries(
		Object.entries(system_folder_name_to_path).map(([key, value]) => [key.toLowerCase(), value])
	);


	const set_dragging_file_paths = (dragging_file_paths) => {
		window.dragging_file_paths = dragging_file_paths;
		let frame = window;
		while (frame !== frame.parent) {
			frame = frame.parent;
			frame.dragging_file_paths = dragging_file_paths;
		}
	};

	function FolderView(folder_path, { asDesktop = false, onStatus, openFolder, openFileOrFolder, onConfigure } = {}) {
		const self = this;
		// TODO: ensure a trailing slash / use path.join where appropriate

		var $folder_view = $(`<div class="folder-view" tabindex="0">`);

		this.element = $folder_view[0];

		this.items = [];

		this.add_item = (folder_view_item) => {
			$folder_view.append(folder_view_item.element);
			this.items.push(folder_view_item);
			// if (this.items.length === 1) {
			// 	// this.items[0].element.focus();
			// 	this.items[0].element.classList.add("focused");
			// }
		};

		// config:
		// - [x] view_mode
		// - [x] sort_mode
		// - [ ] auto_arrange
		// - [ ] icon_positions
		// - [x] view_as_web_page

		this.config = {};
		var storage_key = `folder-config:${asDesktop ? "desktop" : folder_path}`;
		try {
			const config_json = localStorage.getItem(storage_key);
			const config = JSON.parse(config_json);
			if (config) {
				Object.assign(this.config, config);
			}
		} catch (e) {
			console.error("Failed to read folder config:", e);
		}
		// Handling defaults and invalid values at the same time
		if (!FolderView.VIEW_MODES[this.config.view_mode]) {
			this.config.view_mode = asDesktop ?
				FolderView.VIEW_MODES.DESKTOP :
				FolderView.VIEW_MODES.LARGE_ICONS;
		}
		if (!FolderView.SORT_MODES[this.config.sort_mode]) {
			this.config.sort_mode = FolderView.SORT_MODES.NAME;
		}
		///this.config.view_as_web_page ??= folder_path !== "/desktop/";
		if (!this.config.view_as_web_page) {
			this.config.view_as_web_page = folder_path !== "/desktop/";
		}

		this.element.dataset.viewMode = this.config.view_mode;
		this.configure = (config_props) => {
			Object.assign(this.config, config_props);
			if (config_props.view_mode) {
				this.element.dataset.viewMode = config_props.view_mode;
			}
			this.arrange_icons();
			try {
				localStorage.setItem(storage_key, JSON.stringify(this.config));
			} catch (e) {
				console.error("Can't write to localStorage:", e);
			}
			///onConfigure?.(config_props);
			if (onConfigure) {
				onConfigure(config_props);
			}
		};

		this.cycle_view_mode = () => {
			// const view_modes = Object.values(FolderView.VIEW_MODES);
			const view_modes = [
				// FolderView.VIEW_MODES.THUMBNAILS, conditionally?
				FolderView.VIEW_MODES.LARGE_ICONS,
				FolderView.VIEW_MODES.SMALL_ICONS,
				FolderView.VIEW_MODES.LIST,
				// FolderView.VIEW_MODES.DETAILS, // same as list for now
			];
			const current_view_mode_index = view_modes.indexOf(this.config.view_mode);
			const next_view_mode_index = (current_view_mode_index + 1) % view_modes.length;
			this.configure({ view_mode: view_modes[next_view_mode_index] });
		};

		let waiting_on_stats = false;
		this.arrange_icons = () => {
			if (waiting_on_stats) {
				return;
			}
			if (!self.element.isConnected) { // checking parentElement doesn't work if under a shadowRoot
				// console.trace("not in DOM");
				return; // prevent errors computing layout if folder view removed before stats resolve
			}
			const pending_promises = this.items.map((item) => item.pendingStatPromise).filter(Boolean);
			const any_pending = pending_promises.length > 0;
			if (any_pending) {
				if (!waiting_on_stats) {
					// should I choose a batch size? or is waiting on all stats fine?
					// batches mean that it would update multiple times, which could be jarring.
					Promise.allSettled(pending_promises).then(() => {
						waiting_on_stats = false;
						self.arrange_icons();
					});
				}
				waiting_on_stats = true;
			}
			const horizontal_first =
				this.config.view_mode === FolderView.VIEW_MODES.LARGE_ICONS ||
				this.config.view_mode === FolderView.VIEW_MODES.SMALL_ICONS;
			const large_icons =
				this.config.view_mode === FolderView.VIEW_MODES.LARGE_ICONS ||
				this.config.view_mode === FolderView.VIEW_MODES.DESKTOP;
			const icon_size = icon_size_by_view_mode[this.config.view_mode] || 32;

			const grid_size_x = large_icons ? grid_size_x_for_large_icons : grid_size_x_for_small_icons;
			const grid_size_y = large_icons ? grid_size_y_for_large_icons : grid_size_y_for_small_icons;
			var x = 0;
			var y = 0;
			const dir_ness = (item) =>
				// system folders always go first
				// not all system folder shortcuts on the desktop have real paths (currently)
				// so we can't check system_folder_path_to_name, need a separate attribute.
				// system_folder_path_to_name[item.file_path] ? 2 :
				item.is_system_folder ? 2 :
					// then folders, then everything else
					///item.resolvedStats?.isDirectory() ? 1 : 0;
					item.resolvedStats && item.resolvedStats.isDirectory() ? 1 : 0;
			const get_ext = (item) => (item.file_path ||/*??*/ "").split(".").pop();
			if (this.config.sort_mode === FolderView.SORT_MODES.NAME) {
				this.items.sort((a, b) =>
					dir_ness(b) - dir_ness(a) ||
					(a.title ||/*??*/ "").localeCompare(b.title ||/*??*/ "")
				);
			} else if (this.config.sort_mode === FolderView.SORT_MODES.TYPE) {
				this.items.sort((a, b) =>
					dir_ness(b) - dir_ness(a) ||
					(get_ext(a) ||/*??*/ "").localeCompare(get_ext(b) ||/*??*/ "")
				);
			} else if (this.config.sort_mode === FolderView.SORT_MODES.SIZE) {
				this.items.sort((a, b) =>
					dir_ness(b) - dir_ness(a) ||
					(a.resolvedStats.size ||/*??*/ 0) - (b.resolvedStats && b.resolvedStats.size ||/*??*/ 0)
				);
			} else if (this.config.sort_mode === FolderView.SORT_MODES.DATE) {
				this.items.sort((a, b) =>
					dir_ness(b) - dir_ness(a) ||
					(a.resolvedStats && a.resolvedStats.mtime ||/*??*/ 0) - (b.resolvedStats && b.resolvedStats.mtime ||/*??*/ 0)
				);
			}
			for (const item of this.items) {
				$(item.element).css({
					left: x,
					top: y,
				});
				if (horizontal_first) {
					x += grid_size_x;
					if (x + grid_size_x > $folder_view[0].clientWidth) {
						y += grid_size_y;
						x = 0;
					}
				} else {
					y += grid_size_y;
					if (y + grid_size_y > $folder_view[0].clientHeight) {
						x += grid_size_x;
						y = 0;
					}
				}

				item.setIconSize(icon_size);

				// apply sort - well, I'm positioning things absolutely, so I don't need to do this (AS LONG AS I DON'T ASSUME THE DOM ORDER, and use self.items instead)
				// and this is very slow for large folders.
				// this.element.appendChild(item.element);
			}

			if (!any_pending) {
				// this.items[0].element.classList.add("focused");
				this.items.forEach((item, index) => {
					item.element.classList.toggle("focused", index === 0);
				});
				// console.log("this.element.ownerDocument.activeElement", this.element.ownerDocument.activeElement);
				// if (this.element.ownerDocument.activeElement === this.element) {
				this.items[0] && this.items[0].element.focus();
				// }
				updateStatus();
			}
		};

		function updateStatus() {
			onStatus && onStatus({
				items: self.items,
				selectedItems: self.items.filter((item) => item.element.classList.contains("selected")),
			});
		}

		function deleteRecursiveSync(fs, itemPath) {
			if (fs.statSync(itemPath).isDirectory()) {
				for (const childItemName of fs.readdirSync(itemPath)) {
					deleteRecursiveSync(itemPath + "/" + childItemName);
				}
				fs.rmdirSync(itemPath);
			} else {
				fs.unlinkSync(itemPath);
			}
		}

		self.focus = function () {
			if ($folder_view.is(":focus-within")) {
				return; // don't mess with renaming inputs, for instance, if you click on the input
			}
			$folder_view.focus();
			// This doesn't do much if it's yet to be populated:
			if ($folder_view.find(".desktop-icon.focused").length === 0) {
				this.items[0] && this.items[0].element.focus();
			}
			// Initial focus is handled in arrange_icons currently.
		};

		self.select_all = function () {
			$folder_view.find(".desktop-icon").addClass("selected");
			updateStatus();
		};

		self.select_inverse = function () {
			$folder_view.find(".desktop-icon").each(function () {
				$(this).toggleClass("selected");
			});
			updateStatus();
		};

		self.delete_selected = function () {
			const selected_file_paths = $folder_view.find(".desktop-icon.selected")
				.toArray().map((icon_el) => icon_el.dataset.filePath)
				.filter((file_path) => system_folder_path_to_name[file_path] === undefined);

			if (selected_file_paths.length === 0) {
				return;
			}
			// @NOTE: if system setting for displaying file extensions was implemented, this should be changed...
			const name_of_first = $folder_view.find(".desktop-icon.selected .title").text().replace(/\.([^.]+)$/, "");
			showMessageBox({
				title: selected_file_paths.length === 1 ? "Confirm File Delete" : "Confirm Multiple File Delete",
				message: selected_file_paths.length === 1 ?
					`Are you sure you want to delete '${name_of_first}'?` :
					`Are you sure you want to delete these ${selected_file_paths.length} items?`,
				buttons: [
					{
						label: "Yes",
						value: "yes",
						default: true,
					},
					{
						label: "No",
						value: "no",
					},
				],
				iconID: "nuke",
			}).then((result) => {
				if (result !== "yes") {
					return;
				}
				FilesystemSetup.withFilesystem(function () {
					const fs = BrowserFS.BFSRequire('fs');
					let num_deleted = 0;
					for (const file_path of selected_file_paths) {
						let single_delete_success = false;
						try {
							deleteRecursiveSync(fs, file_path);
							single_delete_success = true;
							num_deleted += 1;
						} catch (error) {
							console.log("failed to delete", file_path, error);
						}
						if (single_delete_success) {
							self.items.forEach((item) => {
								if (item.element.dataset.filePath === file_path) {
									item.element.remove();
									updateStatus();
								}
							});
						}
					}
					// TODO: pluralization, and be more specific about folders vs files vs selected items, and total
					if (num_deleted < selected_file_paths.length) {
						alert(`Failed to delete ${selected_file_paths.length - num_deleted} items.`);
					}
					// self.refresh();
				});
			});
		};

		self.start_rename = () => {
			for (const item of self.items) {
				if (item.element.classList.contains("focused")) {
					item.start_rename();
					break;
				}
			}
		};

		// Read the folder and create icon items
		FilesystemSetup.withFilesystem(function () {
			var fs = BrowserFS.BFSRequire('fs');
			fs.readdir(folder_path, function (error, contents) {
				if (error) {
					alert("Failed to read contents of the directory " + folder_path);
					throw error;
				}

				for (var i = 0; i < contents.length; i++) {
					var fname = contents[i];
					add_fs_item(fname, -1000, -1000);
				}
				self.arrange_icons();
			});
		});

		// NOTE: in Windows, icons by default only get moved if they go offscreen (by maybe half the grid size)
		// we're handling it as if Auto Arrange is on (@TODO: support Auto Arrange off)
		const resizeObserver = new ResizeObserver(entries => {
			self.arrange_icons();
		});
		resizeObserver.observe(self.element);

		// Handle selecting icons
		(function () {
			var $marquee = $("<div class='marquee'/>").appendTo($folder_view).hide();
			var start = { x: 0, y: 0 };
			var current = { x: 0, y: 0 };
			var dragging = false;
			var drag_update = function () {
				var min_x = Math.min(start.x, current.x);
				var min_y = Math.min(start.y, current.y);
				var max_x = Math.max(start.x, current.x);
				var max_y = Math.max(start.y, current.y);
				$marquee.show().css({
					position: "absolute",
					left: min_x,
					top: min_y,
					width: max_x - min_x,
					height: max_y - min_y,
				});
				$folder_view.find(".desktop-icon").each(function (i, folder_view_icon) {
					// Note: this is apparently considerably more complex in Windows 98
					// like things are not considered the same heights and/or positions based on the size of their names
					var icon_offset = $(folder_view_icon).offset();
					var icon_left = parseFloat($(folder_view_icon).css("left"));
					var icon_top = parseFloat($(folder_view_icon).css("top"));
					var icon_width = $(folder_view_icon).width();
					var icon_height = $(folder_view_icon).height();
					folder_view_icon.classList.toggle("selected",
						icon_left < max_x &&
						icon_top < max_y &&
						icon_left + icon_width > min_x &&
						icon_top + icon_height > min_y
					);
				});
				updateStatus();
			};
			$folder_view.on("pointerdown", ".desktop-icon", function (e) {
				const item_el = e.currentTarget;
				item_el._was_selected_at_pointerdown = item_el.classList.contains("selected");
				select_item(item_el, e, true);
			});
			$folder_view.on("pointerdown", function (e) {
				// TODO: allow a margin of mouse movement before starting selecting
				var view_was_focused = $folder_view.is(":focus-within");
				self.focus();
				var $icon = $(e.target).closest(".desktop-icon");
				$marquee.hide();
				// var folder_view_offset = $folder_view.offset();
				var folder_view_offset = self.element.getBoundingClientRect();
				start = { x: e.pageX - folder_view_offset.left + $folder_view[0].scrollLeft, y: e.pageY - folder_view_offset.top + $folder_view[0].scrollTop };
				current = { x: e.pageX - folder_view_offset.left + $folder_view[0].scrollLeft, y: e.pageY - folder_view_offset.top + $folder_view[0].scrollTop };
				if ($icon.length > 0) {
					$marquee.hide();
					set_dragging_file_paths($(".desktop-icon.selected").get().map((icon) =>
						icon.dataset.filePath
					).filter((file_path) => file_path));
				} else {
					set_dragging_file_paths([]);
					// start dragging marquee unless over scrollbar
					let scrollbar_width = $folder_view[0].offsetWidth - $folder_view[0].clientWidth;
					let scrollbar_height = $folder_view[0].offsetHeight - $folder_view[0].clientHeight;
					scrollbar_width += 2; // for marquee border (@TODO: make marquee unable to cause scrollbar, by putting it in an overflow: hidden container)
					scrollbar_height += 2; // for marquee border
					const rect = $folder_view[0].getBoundingClientRect();
					const over_scrollbar = e.clientX > rect.right - scrollbar_width || e.clientY > rect.bottom - scrollbar_height;
					// console.log(`over_scrollbar: ${over_scrollbar}, e.clientX: ${e.clientX}, rect.right - scrollbar_width: ${rect.right - scrollbar_width}`);
					dragging = !over_scrollbar;
					// don't deselect right away unless the 
					// TODO: deselect on pointerUP, if the desktop was focused
					// or when starting selecting (re: TODO: allow a margin of movement before starting selecting)
					if (dragging && view_was_focused) {
						drag_update();
					}
				}
				$($folder_view[0].ownerDocument).on("pointermove", handle_pointermove);
				$($folder_view[0].ownerDocument).on("pointerup blur", handle_pointerup_blur);
			});
			function handle_pointermove (e) {
				// var folder_view_offset = $folder_view.offset();
				var folder_view_offset = self.element.getBoundingClientRect();
				current = { x: e.pageX - folder_view_offset.left + $folder_view[0].scrollLeft, y: e.pageY - folder_view_offset.top + $folder_view[0].scrollTop };
				// clamp coordinates to within folder view
				// This accomplishes three things:
				// 1. it improves the visual coherence of the marquee as an object
				// 2. it makes the marquee not cause a scrollbar
				// 3. it prevents selecting things you can't see
				const scrollbar_width = $folder_view.width() - $folder_view[0].clientWidth;
				const scrollbar_height = $folder_view.height() - $folder_view[0].clientHeight;
				const clamp_left = $folder_view[0].scrollLeft;
				const clamp_top = $folder_view[0].scrollTop;
				const clamp_right = $folder_view.width() + $folder_view[0].scrollLeft - scrollbar_width;
				const clamp_bottom = $folder_view.height() + $folder_view[0].scrollTop - scrollbar_height;
				current.x = Math.max(clamp_left, Math.min(clamp_right, current.x));
				current.y = Math.max(clamp_top, Math.min(clamp_bottom, current.y));
				if (dragging) {
					drag_update();
					// scroll the view by dragging the mouse at/past the edge
					const scroll_speed = 10;
					if (current.x === clamp_left) {
						$folder_view[0].scrollLeft -= scroll_speed;
					} else if (current.x === clamp_right) {
						$folder_view[0].scrollLeft += scroll_speed;
					}
					if (current.y === clamp_top) {
						$folder_view[0].scrollTop -= scroll_speed;
					} else if (current.y === clamp_bottom) {
						$folder_view[0].scrollTop += scroll_speed;
					}
				}
			};
			function handle_pointerup_blur() {
				$marquee.hide();
				dragging = false;
				set_dragging_file_paths([]);
				$($folder_view[0].ownerDocument).off("pointermove", handle_pointermove);
				$($folder_view[0].ownerDocument).off("pointerup blur", handle_pointerup_blur);
			};
		})();

		let search_string = "";
		let search_timeout;

		$folder_view.on("keydown", function (e) {
			// console.log("keydown", e.isDefaultPrevented());

			if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
				return;
			}
			if (e.key == "Enter") {
				$folder_view.find(".desktop-icon.selected").trigger("dblclick");
			} else if (e.ctrlKey && e.key == "a") {
				folder_view.select_all();
				e.preventDefault();
			} else if (e.key == "Delete") {
				self.delete_selected();
				e.preventDefault();
			} else if (
				e.key == "ArrowLeft" ||
				e.key == "ArrowRight" ||
				e.key == "ArrowUp" ||
				e.key == "ArrowDown"
			) {
				e.preventDefault();
				const move_x = e.key == "ArrowLeft" ? -1 : e.key == "ArrowRight" ? 1 : 0;
				const move_y = e.key == "ArrowUp" ? -1 : e.key == "ArrowDown" ? 1 : 0;
				navigate_grid(move_x, move_y, e);
				// @TODO: wrap around columns in list view
			} else if (
				e.key == "PageUp" ||
				e.key == "PageDown"
			) {
				e.preventDefault();
				if (self.config.view_mode === FolderView.VIEW_MODES.LIST) {
					const x_dir = e.key == "PageUp" ? -1 : 1;
					const full_page_size = $folder_view.width();
					const item_width = $folder_view.find(".desktop-icon").outerWidth();
					const page_increment = full_page_size - item_width;
					for (let increment = page_increment; increment > 0; increment -= item_width) {
						if (navigate_grid(x_dir * increment / item_width, 0, e)) { // grid units
							break;
						}
					}
				} else {
					const y_dir = e.key == "PageUp" ? -1 : 1;
					const full_page_size = $folder_view.height();
					const item_height = $folder_view.find(".desktop-icon").outerHeight();
					const page_increment = full_page_size - item_height;
					for (let increment = page_increment; increment > 0; increment -= item_height) {
						if (navigate_grid(0, y_dir * increment / item_height, e)) { // grid units
							break;
						}
					}
				}
			} else if (e.key == "Home") {
				e.preventDefault();
				select_item(self.items[0], e);
			} else if (e.key == "End") {
				e.preventDefault();
				select_item(self.items[self.items.length - 1], e);
			} else if (e.key == " " && search_string.length === 0) {
				// Usually there's something focused,
				// so this is pretty "niche", but space bar selects the focused item.
				// Ctrl+Space toggles selection of the focused item.
				e.preventDefault();
				if ((e.ctrlKey || e.metaKey) && $folder_view.find(".desktop-icon.selected").length > 0) {
					$folder_view.find(".desktop-icon.focused").toggleClass("selected");
				} else {
					$folder_view.find(".desktop-icon.focused").addClass("selected"); // don't use select_item() as it shouldn't unselect anything
				}
				updateStatus();
			} else if (e.key === "F2") {
				e.preventDefault();
				self.start_rename();
			} else {
				if (e.isDefaultPrevented() || e.ctrlKey || e.altKey || e.metaKey) {
					return;
				}
				if (search_timeout) {
					clearTimeout(search_timeout);
				}
				if (search_string === e.key) {
					// cycle through items starting with the same letter
					// Note: not adding to search_string here, so it stays as e.key
					// @TODO: what if you have an item like "Llama Photos", can you not search for "Llama" to go to it, in the presence of other 'L' items?
					const candidates = self.items.filter((item) => {
						const title = item.element.querySelector(".title").textContent; // @TODO: proper access
						return title.toLocaleLowerCase().startsWith(search_string.toLocaleLowerCase());
					});
					if (candidates.length > 0) {
						const index = candidates.findIndex((item) => item.element.classList.contains("focused"));
						if (index === -1) {
							select_item(candidates[0], e);
						} else {
							select_item(candidates[(index + 1) % candidates.length], e);
						}
					}
				} else {
					// focus item matching search string
					if (e.key !== "Shift" && e.key !== "Compose") { // Note: composition doesn't actually work; I'd need an input element to do this properly
						search_string += e.key;
					}
					// console.log("search_string: " + search_string);
					search_timeout = setTimeout(function () {
						search_string = "";
						// console.log("reset search_string");
					}, 1000);

					if (search_string.length > 0) {
						for (const item of self.items) {
							const title = item.element.querySelector(".title").textContent; // @TODO: proper access
							if (title.toLocaleLowerCase().startsWith(search_string.toLocaleLowerCase())) {
								select_item(item, {}); // passing fake event so it doesn't use shiftKey to determine multi-select
								break;
							}
						}
					}
				}
			}
		});

		var selection_anchor_item_el;

		function select_item(item_or_item_el, event, delay_scroll) {
			const item_el_to_select = item_or_item_el instanceof Element ? item_or_item_el : item_or_item_el.element;
			const extend_selection = event.shiftKey;
			if (selection_anchor_item_el && !self.items.some(item => item.element === selection_anchor_item_el)) {
				selection_anchor_item_el = null; // item was removed somehow
			}
			if (extend_selection && !selection_anchor_item_el) {
				// select_item() hasn't been called yet (e.g. hitting Shift+Down without first hitting an arrow key without Shift, in a newly loaded folder view)
				// use the focused item as the anchor
				selection_anchor_item_el = self.items.find((item) => item.element.classList.contains("focused"))/*?*/.element ||/*??*/ item_el_to_select;
			}
			// console.log("select_item", item_or_item_el, event, "extend_selection", extend_selection);
			$folder_view.find(".desktop-icon").each(function (i, item_el) {
				if (extend_selection) {
					// select items in a rectangle between the anchor and the new item
					const anchor_rect = selection_anchor_item_el.getBoundingClientRect();
					const item_el_to_select_rect = item_el_to_select.getBoundingClientRect();
					const item_el_rect = item_el.getBoundingClientRect();
					const rectangle = {
						top: Math.min(anchor_rect.top, item_el_to_select_rect.top),
						left: Math.min(anchor_rect.left, item_el_to_select_rect.left),
						bottom: Math.max(anchor_rect.bottom, item_el_to_select_rect.bottom),
						right: Math.max(anchor_rect.right, item_el_to_select_rect.right)
					};
					$(item_el).toggleClass("selected", (
						item_el_rect.top >= rectangle.top &&
						item_el_rect.left >= rectangle.left &&
						item_el_rect.bottom <= rectangle.bottom &&
						item_el_rect.right <= rectangle.right
					));
				} else {
					if (event.type === "pointerdown" && (event.ctrlKey || event.metaKey)) {
						// toggle with Ctrl+click
						if (item_el === item_el_to_select) {
							$(item_el).toggleClass("selected");
						}
					} else {
						// select with click or arrow keys,
						// but if holding Ctrl it should only move focus, not select.
						if (!event.ctrlKey && !event.metaKey) {
							item_el.classList.toggle("selected", item_el === item_el_to_select);
						}
					}
				}
				item_el.classList.toggle("focused", item_el === item_el_to_select);
			});
			if (delay_scroll) {
				// Windows 98 does this for clicks.
				// I'm not sure if it's to make it less jarring (I feel like there's a case for that),
				// or if it's to avoid some problems with drag and drop perhaps.
				setTimeout(() => {
					item_el_to_select.scrollIntoView({ block: "nearest" });
				}, 500);
			} else {
				item_el_to_select.scrollIntoView({ block: "nearest" });
			}
			updateStatus();

			if (!event.shiftKey) {
				selection_anchor_item_el = item_el_to_select;
			}
		}

		function navigate_grid(move_x, move_y, event) {
			// @TODO: how this is supposed to work for icons not aligned to the grid?
			// I can imagine a few ways of doing it, like scanning for the nearest icon with a sweeping line or perhaps a "cone" (triangle) (changing width line)
			// but it'd be nice to know for sure

			let $starting_icon = $folder_view.find(".desktop-icon.focused");
			// ideally we'd keep a focused icon always,
			// use the nearest icon upwards after a delete etc.
			// but I can't guarantee that
			if ($starting_icon.length == 0) {
				$starting_icon = $folder_view.find(".desktop-icon");
			}
			if ($starting_icon.length == 0) {
				return false;
			}
			// @TODO: use the actual grid size, not a calculated item size
			// or make it more grid-agnostic (Windows 98 allowed freely moving icons around)
			const item_width = $starting_icon.outerWidth();
			const item_height = $starting_icon.outerHeight();
			// const item_pos = $starting_icon.position();
			const item_pos = $starting_icon[0].getBoundingClientRect();
			let x = item_pos.left;// + item_width / 2;
			let y = item_pos.top;// + item_height / 2;
			x += move_x * item_width;
			y += move_y * item_height;
			const candidates = $folder_view.find(".desktop-icon").toArray().sort(function (a, b) {
				// const a_pos = $(a).position();
				// const b_pos = $(b).position();
				const a_pos = a.getBoundingClientRect();
				const b_pos = b.getBoundingClientRect();
				const a_dist = Math.abs(a_pos.left - x) + Math.abs(a_pos.top - y);
				const b_dist = Math.abs(b_pos.left - x) + Math.abs(b_pos.top - y);
				return a_dist - b_dist;
			});
			const $icon = $(candidates[0]);
			if ($icon.length > 0) {
				select_item($icon[0], event);
				return true;
			}
			return false;
		}

		var stat = function (file_path) {
			// fs should be guaranteed available at this point
			// as this function is currently used
			var fs = BrowserFS.BFSRequire('fs');
			return new Promise(function (resolve, reject) {
				fs.stat(file_path, function (err, stats) {
					if (err) {
						return reject(err);
					}
					resolve(stats);
				});
			});
		};
		var icon_id_from_stats_and_path = function (stats, file_path) {
			if (stats.isDirectory()) {
				// if extending this to different folder icons,
				// note that "folder" is relied on (for sorting)
				return "folder";
			}
			var file_extension = helpers.file_extension_from_path(file_path);
			// TODO: look inside exe for icons
			var icon_name = file_extension_icons[file_extension.toLowerCase()];
			return icon_name || "document";
		};
		var icons_from_icon_id = function (icon_id) {
			return {
				16: helpers.getIconPath(icon_id, 16),
				32: helpers.getIconPath(icon_id, 32),
				48: helpers.getIconPath(icon_id, 48),
			};
		};

		// var add_fs_item = function(file_path, x, y){
		var add_fs_item = function (initial_file_name, x, y) {
			var initial_file_path = folder_path + initial_file_name;
			var item = new FolderViewItem({
				title: initial_file_name,
				open: async function () {
					if (openFolder) {
						let stats = item.resolvedStats;
						if (!stats) {
							if (item.pendingStatPromise) {
								try {
									stats = await item.pendingStatPromise;
								} catch (error) {
									alert(`Failed to get info about '${item.file_path}':\n\n${error}`);
									return;
								}
							} else {
								alert(`Cannot open '${item.file_path}'. File type information not available.`);
								return;
							}
						}
						if (stats.isDirectory()) {
							openFolder(item.file_path);
							return;
						}
					}
					if (openFileOrFolder) {
						openFileOrFolder(item.file_path);
						return;
					}
					alert(`No handler for opening files or folders.`);
				},
				rename: (new_name) => {
					var fs = BrowserFS.BFSRequire('fs');
					return new Promise(function (resolve, reject) {
						const new_file_path = folder_path + new_name;
						fs.rename(item.file_path, new_file_path, function (err) {
							if (err) {
								return reject(err);
							}
							resolve();
							item.file_path = new_file_path;
							item.title = new_name;
							item.element.dataset.filePath = new_file_path;
							if (item.resolvedStats) {
								const icon_id = icon_id_from_stats_and_path(item.resolvedStats, new_file_path);
								item.setIcons(icons_from_icon_id(icon_id));
							} // else the icon will be updated when the stats are resolved
						});
					});
				},
				shortcut: initial_file_path.match(/\.url$/),
				file_path: initial_file_path,
				iconSize: icon_size_by_view_mode[self.config.view_mode],
			});
			item.pendingStatPromise = stat(initial_file_path);
			item.pendingStatPromise.then((stats) => {
				item.pendingStatPromise = null;
				item.resolvedStats = stats; // trying to indicate in the name the async nature
				// @TODO: know which sizes are available
				const icon_id = icon_id_from_stats_and_path(stats, item.file_path);
				item.setIcons(icons_from_icon_id(icon_id));
			}, (error) => {
				// Without this, the folder view infinitely recursed arranging items because
				// it was waiting for the promise to be settled (resolved or rejected),
				// but checking for item.pendingStatPromise to see if it's still pending.
				item.pendingStatPromise = null;
			});
			self.add_item(item);
			$(item.element).css({
				left: x,
				top: y,
			});
		};
		var drop_file = function (file, x, y) {

			var Buffer = BrowserFS.BFSRequire('buffer').Buffer;
			var fs = BrowserFS.BFSRequire('fs');

			var file_path = folder_path + file.name;

			var reader = new FileReader;
			reader.onerror = function (error) {
				throw error;
			};
			reader.onload = function (e) {
				var buffer = Buffer.from(reader.result);
				fs.writeFile(file_path, buffer, { flag: "wx" }, function (error) {
					if (error) {
						if (error.code === "EEXIST") {
							// TODO: options to replace or keep both files with numbers like "file (1).txt"
							alert("File already exists!");
						}
						throw error;
					}
					// TODO: could do utimes as well with file.lastModified or file.lastModifiedDate

					add_fs_item(file.name, x, y);
				});
			};
			reader.readAsArrayBuffer(file);
		};

		var dragover_pageX = 0;
		var dragover_pageY = 0;
		$folder_view.on("dragover", function (e) {
			e.preventDefault();
			dragover_pageX = e.originalEvent.pageX;
			dragover_pageY = e.originalEvent.pageY;
		});
		$folder_view.on("drop", function (e) {
			e.preventDefault();
			var x = e.originalEvent.pageX || dragover_pageX;
			var y = e.originalEvent.pageY || e.dragover_pageY
			// TODO: handle dragging icons onto other icons
			withFilesystem(function () {
				var files = e.originalEvent.dataTransfer.files;
				$.map(files, function (file) {
					// TODO: stagger positions, don't just put everything on top of each other
					// also center on the mouse position; currently it's placed via the top left
					drop_file(file, x, y);
				});
			});
		});
	}

	return FolderView;
});
define('skylark-98js/os-gui/$Window',[
	"skylark-jquery",
	"../win98"
],function($,win98js){

	// TODO: E\("([a-z]+)"\) -> "<$1>" or get rid of jQuery as a dependency
	function E(tagName) {
		return document.createElement(tagName);
	}

	function element_to_string(element) {
		// returns a CSS-selector-like string for the given element
		// if (element instanceof Element) { // doesn't work with different window.Element from iframes
		if (typeof element === "object" && "tagName" in element) {
			return element.tagName.toLowerCase() +
				(element.id ? "#" + element.id : "") +
				(element.className ? "." + element.className.split(" ").join(".") : "") +
				(element.src ? `[src="${element.src}"]` : "") + // Note: not escaped; may not actually work as a selector (but this is for debugging)
				(element.srcdoc ? "[srcdoc]" : "") + // (srcdoc can be long)
				(element.href ? `[href="${element.href}"]` : "");
		} else if (element) {
			return element.constructor.name;
		} else {
			return `${element}`;
		}
	}

	function find_tabstops(container_el) {
		const $el = $(container_el);
		// This function finds focusable controls, but not necessarily all of them;
		// for radio elements, it only gives one: either the checked one, or the first one if none are checked.

		// Note: for audio[controls], Chrome at least has two tabstops (the audio element and three dots menu button).
		// It might be possible to detect this in the shadow DOM, I don't know, I haven't worked with the shadow DOM.
		// But it might be more reliable to make a dummy tabstop element to detect when you tab out of the first/last element.
		// Also for iframes!
		// Assuming that doesn't mess with screen readers.
		// Right now you can't tab to the three dots menu if it's the last element.
		// @TODO: see what ally.js does. Does it handle audio[controls]? https://allyjs.io/api/query/tabsequence.html

		let $controls = $el.find(`
			input:enabled,
			textarea:enabled,
			select:enabled,
			button:enabled,
			a[href],
			[tabIndex='0'],
			details summary,
			iframe,
			object,
			embed,
			video[controls],
			audio[controls],
			[contenteditable]:not([contenteditable='false'])
		`).filter(":visible");
		// const $controls = $el.find(":tabbable"); // https://api.jqueryui.com/tabbable-selector/

		// Radio buttons should be treated as a group with one tabstop.
		// If there's no selected ("checked") radio, it should still visit the group,
		// but if there is a selected radio in the group, it should skip all unselected radios in the group.
		const radios = {}; // best radio found so far, per group
		const to_skip = [];
		for (const el of $controls.toArray()) {
			if (el.nodeName.toLowerCase() === "input" && el.type === "radio") {
				if (radios[el.name]) {
					if (el.checked) {
						to_skip.push(radios[el.name]);
						radios[el.name] = el;
					} else {
						to_skip.push(el);
					}
				} else {
					radios[el.name] = el;
				}
			}
		}
		const $tabstops = $controls.not(to_skip);
		// debug viz:
		// $tabstops.css({boxShadow: "0 0 2px 2px green"});
		// $(to_skip).css({boxShadow: "0 0 2px 2px gray"})
		return $tabstops;
	}
	var $G = $(window);


	$Window.Z_INDEX = 5;

	var minimize_slots = []; // for if there's no taskbar

	// @TODO: make this a class,
	// instead of a weird pseudo-class
	function $Window(options) {
		options = options || {};
		// @TODO: handle all option defaults here
		// and validate options.

		var $w = $(E("div")).addClass("window os-window").appendTo("body");
		$w[0].$window = $w;
		$w.element = $w[0];
		$w[0].id = `os-window-${Math.random().toString(36).substr(2, 9)}`;
		$w.$titlebar = $(E("div")).addClass("window-titlebar").appendTo($w);
		$w.$title_area = $(E("div")).addClass("window-title-area").appendTo($w.$titlebar);
		$w.$title = $(E("span")).addClass("window-title").appendTo($w.$title_area);
		if (options.toolWindow) {
			options.minimizeButton = false;
			options.maximizeButton = false;
		}
		if (options.minimizeButton !== false) {
			$w.$minimize = $(E("button")).addClass("window-minimize-button window-action-minimize window-button").appendTo($w.$titlebar);
			$w.$minimize.attr("aria-label", "Minimize window"); // @TODO: for taskbarless minimized windows, "restore"
			$w.$minimize.append("<span class='window-button-icon'></span>");
		}
		if (options.maximizeButton !== false) {
			$w.$maximize = $(E("button")).addClass("window-maximize-button window-action-maximize window-button").appendTo($w.$titlebar);
			$w.$maximize.attr("aria-label", "Maximize or restore window"); // @TODO: specific text for the state
			if (!options.resizable) {
				$w.$maximize.attr("disabled", true);
			}
			$w.$maximize.append("<span class='window-button-icon'></span>");
		}
		if (options.closeButton !== false) {
			$w.$x = $(E("button")).addClass("window-close-button window-action-close window-button").appendTo($w.$titlebar);
			$w.$x.attr("aria-label", "Close window");
			$w.$x.append("<span class='window-button-icon'></span>");
		}
		$w.$content = $(E("div")).addClass("window-content").appendTo($w);
		$w.$content.attr("tabIndex", "-1");
		$w.$content.css("outline", "none");
		if (options.toolWindow) {
			$w.addClass("tool-window");
		}
		if (options.parentWindow) {
			options.parentWindow.addChildWindow($w);
			// semantic parent logic is currently only suited for tool windows
			// for dialog windows, it would make the dialog window not show as focused
			// (alternatively, I could simply, when following the semantic parent chain, look for windows that are not tool windows)
			if (options.toolWindow) {
				$w[0].dataset.semanticParent = options.parentWindow[0].id;
			}
		}

		var $component = options.$component;
		if (typeof options.icon === "object" && "tagName" in options.icon) {
			options.icons = { any: options.icon };
		} else if (options.icon) {
			// old terrible API using globals that you have to define
			console.warn("DEPRECATED: use options.icons instead of options.icon, e.g. new $Window({icons: {16: 'app-16x16.png', any: 'app-icon.svg'}})");
			if (typeof $Icon !== "undefined" && typeof TITLEBAR_ICON_SIZE !== "undefined") {
				$w.icon_name = options.icon;
				$w.$icon = $Icon(options.icon, TITLEBAR_ICON_SIZE).prependTo($w.$titlebar);
			} else {
				throw new Error("Use {icon: img_element} or {icons: {16: url_or_img_element}} options");
			}
		}
		$w.icons = options.icons || {};
		let iconSize = 16;
		$w.setTitlebarIconSize = function (target_icon_size) {
			if ($w.icons) {
				$w.$icon && $w.$icon.remove();
				$w.$icon = $($w.getIconAtSize(target_icon_size));
				$w.$icon.prependTo($w.$titlebar);
			}
			iconSize = target_icon_size;
			$w.trigger("icon-change");
		};
		$w.getTitlebarIconSize = function () {
			return iconSize;
		};
		// @TODO: this could be a static method, like OSGUI.getIconAtSize(icons, targetSize)
		$w.getIconAtSize = function (target_icon_size) {
			let icon_size;
			if ($w.icons[target_icon_size]) {
				icon_size = target_icon_size;
			} else if ($w.icons["any"]) {
				icon_size = "any";
			} else {
				const sizes = Object.keys($w.icons).filter(size => isFinite(size) && isFinite(parseFloat(size)));
				sizes.sort((a, b) => Math.abs(a - target_icon_size) - Math.abs(b - target_icon_size));
				icon_size = sizes[0];
			}
			if (icon_size) {
				const icon = $w.icons[icon_size];
				let icon_element;
				if (icon.nodeType !== undefined) {
					icon_element = icon.cloneNode(true);
				} else {
					icon_element = E("img");
					const $icon = $(icon_element);
					if (icon.srcset) {
						$icon.attr("srcset", icon.srcset);
					} else {
						$icon.attr("src", icon.src || icon);
					}
					$icon.attr({
						width: icon_size,
						height: icon_size,
						draggable: false,
					});
					$icon.css({
						width: target_icon_size,
						height: target_icon_size,
					});
				}
				return icon_element;
			}
			return null;
		};
		// @TODO: automatically update icon size based on theme (with a CSS variable)
		$w.setTitlebarIconSize(iconSize);

		$w.getIconName = () => {
			console.warn("DEPRECATED: use $w.icons object instead of $w.icon_name");
			return $w.icon_name;
		};
		$w.setIconByID = (icon_name) => {
			console.warn("DEPRECATED: use $w.setIcons(icons) instead of $w.setIconByID(icon_name)");
			var old_$icon = $w.$icon;
			$w.$icon = $Icon(icon_name, TITLEBAR_ICON_SIZE);
			old_$icon.replaceWith($w.$icon);
			$w.icon_name = icon_name;
			$w.task && $w.task.updateIcon();
			$w.trigger("icon-change");
			return $w;
		};
		$w.setIcons = (icons) => {
			$w.icons = icons;
			$w.setTitlebarIconSize(iconSize);
			$w.task && $w.task.updateIcon();
			// icon-change already sent by setTitlebarIconSize
		};

		if ($component) {
			$w.addClass("component-window");
		}

		setTimeout(() => {
			if (get_direction() == "rtl") {
				$w.addClass("rtl"); // for reversing the titlebar gradient
			}
		}, 0);

		// returns writing/layout direction, "ltr" or "rtl"
		function get_direction() {
			return window.get_direction ? window.get_direction() : getComputedStyle($w[0]).direction;
		}

		// This is very silly, using jQuery's event handling to implement simpler event handling.
		// But I'll implement it in a non-silly way at least when I remove jQuery. Maybe sooner.
		const $event_target = $({});
		const make_simple_listenable = (name) => {
			return (callback) => {
				const fn = () => {
					callback();
				};
				$event_target.on(name, fn);
				const dispose = () => {
					$event_target.off(name, fn);
				};
				return dispose;
			};
		};
		$w.onFocus = make_simple_listenable("focus");
		$w.onBlur = make_simple_listenable("blur");
		$w.onClosed = make_simple_listenable("closed");

		$w.setDimensions = ({ innerWidth, innerHeight, outerWidth, outerHeight }) => {
			let width_from_frame, height_from_frame;
			// It's good practice to make all measurements first, then update the DOM.
			// Once you update the DOM, the browser has to recalculate layout, which can be slow.
			if (innerWidth) {
				width_from_frame = $w.outerWidth() - $w.$content.outerWidth();
			}
			if (innerHeight) {
				height_from_frame = $w.outerHeight() - $w.$content.outerHeight();
				const $menu_bar = $w.$content.find(".menus"); // only if inside .content; might move to a slot outside .content later
				if ($menu_bar.length) {
					// maybe this isn't technically part of the frame, per se? but it's part of the non-client area, which is what I technically mean.
					height_from_frame += $menu_bar.outerHeight();
				}
			}
			if (outerWidth) {
				$w.outerWidth(outerWidth);
			}
			if (outerHeight) {
				$w.outerHeight(outerHeight);
			}
			if (innerWidth) {
				$w.outerWidth(innerWidth + width_from_frame);
			}
			if (innerHeight) {
				$w.outerHeight(innerHeight + height_from_frame);
			}
		};
		$w.setDimensions(options);

		let child_$windows = [];
		$w.addChildWindow = ($child_window) => {
			child_$windows.push($child_window);
		};
		const showAsFocused = () => {
			if ($w.hasClass("focused")) {
				return;
			}
			$w.addClass("focused");
			$event_target.triggerHandler("focus");
		};
		const stopShowingAsFocused = () => {
			if (!$w.hasClass("focused")) {
				return;
			}
			$w.removeClass("focused");
			$event_target.triggerHandler("blur");
		};
		$w.focus = () => {
			// showAsFocused();	
			$w.bringToFront();
			refocus();
		};
		$w.blur = () => {
			stopShowingAsFocused();
			if (document.activeElement && document.activeElement.closest(".window") == $w[0]) {
				document.activeElement.blur();
			}
		};

		if (options.toolWindow) {
			if (options.parentWindow) {
				options.parentWindow.onFocus(showAsFocused);
				options.parentWindow.onBlur(stopShowingAsFocused);
				// TODO: also show as focused if focus is within the window

				// initial state
				// might need a setTimeout, idk...
				if (document.activeElement && document.activeElement.closest(".window") == options.parentWindow[0]) {
					showAsFocused();
				}
			} else {
				// the browser window is the parent window
				// show focus whenever the browser window is focused
				$(window).on("focus", showAsFocused);
				$(window).on("blur", stopShowingAsFocused);
				// initial state
				if (document.hasFocus()) {
					showAsFocused();
				}
			}
		} else {
			// global focusout is needed, to continue showing as focused while child windows or menu popups are focused (@TODO: Is this redundant with focusin?)
			// global focusin is needed, to show as focused when a child window becomes focused (when perhaps nothing was focused before, so no focusout event)
			// global blur is needed, to show as focused when an iframe gets focus, because focusin/out doesn't fire at all in that case
			// global focus is needed, to stop showing as focused when an iframe loses focus
			// pretty ridiculous!!
			// but it still doesn't handle the case where the browser window is not focused, and the user clicks an iframe directly.
			// for that, we need to listen inside the iframe, because no events are fired at all outside in that case,
			// and :focus/:focus-within doesn't work with iframes so we can't even do a hack with transitionstart.
			// @TODO: simplify the strategy; I ended up piling a few strategies on top of each other, and the earlier ones may be redundant.
			// In particular, 1. I ended up making it proactively inject into iframes, rather than when focused since there's a case where focus can't be detected otherwise.
			// 2. I ended up simulating focusin events for iframes.
			// I may want to rely on that, or, I may want to remove that and set up a refocus chain directly instead,
			// avoiding refocus() which may interfere with drag operations in an iframe when focusing the iframe (e.g. clicking into Paint to draw or drag a sub-window).

			// console.log("adding global focusin/focusout/blur/focus for window", $w[0].id);
			const global_focus_update_handler = make_focus_in_out_handler($w[0], true); // must be $w and not $content so semantic parent chain works, with [data-semantic-parent] pointing to the window not the content
			window.addEventListener("focusin", global_focus_update_handler);
			window.addEventListener("focusout", global_focus_update_handler);
			window.addEventListener("blur", global_focus_update_handler);
			window.addEventListener("focus", global_focus_update_handler);

			function setupIframe(iframe) {
				if (!focus_update_handlers_by_container.has(iframe)) {
					const iframe_update_focus = make_focus_in_out_handler(iframe, false);
					// this also operates as a flag to prevent multiple handlers from being added, or waiting for the iframe to load duplicately
					focus_update_handlers_by_container.set(iframe, iframe_update_focus);

					// @TODO: try removing setTimeout(s)
					setTimeout(() => { // for iframe src to be set? I forget.
						// Note: try must be INSIDE setTimeout, not outside, to work.
						try {
							const wait_for_iframe_load = (callback) => {
								// Note: error may occur accessing iframe.contentDocument; this must be handled by the caller.
								// To that end, this function must access it synchronously, to allow the caller to handle the error.
								if (iframe.contentDocument.readyState == "complete") {
									callback();
								} else {
									// iframe.contentDocument.addEventListener("readystatechange", () => {
									// 	if (iframe.contentDocument.readyState == "complete") {
									// 		callback();
									// 	}
									// });
									setTimeout(() => {
										wait_for_iframe_load(callback);
									}, 100);
								}
							};
							wait_for_iframe_load(() => {
								// console.log("adding focusin/focusout/blur/focus for iframe", iframe);
								iframe.contentWindow.addEventListener("focusin", iframe_update_focus);
								iframe.contentWindow.addEventListener("focusout", iframe_update_focus);
								iframe.contentWindow.addEventListener("blur", iframe_update_focus);
								iframe.contentWindow.addEventListener("focus", iframe_update_focus);
								observeIframes(iframe.contentDocument);
							});
						} catch (error) {
							warn_iframe_access(iframe, error);
						}
					}, 100);
				}
			}

			function observeIframes(container_node) {
				const observer = new MutationObserver((mutations) => {
					for (const mutation of mutations) {
						for (const node of mutation.addedNodes) {
							if (node.tagName == "IFRAME") {
								setupIframe(node);
							}
						}
					}
				});
				observer.observe(container_node, { childList: true, subtree: true });
				// needed in recursive calls (for iframes inside iframes)
				// (for the window, it shouldn't be able to have iframes yet)
				for (const iframe of container_node.querySelectorAll("iframe")) {
					setupIframe(iframe);
				}
			}

			observeIframes($w.$content[0]);
			
			function make_focus_in_out_handler(logical_container_el, is_root) {
				// In case of iframes, logical_container_el is the iframe, and container_node is the iframe's contentDocument.
				// container_node is not a parameter here because it can change over time, may be an empty document before the iframe is loaded.

				return function handle_focus_in_out(event) {
					const container_node = logical_container_el.tagName == "IFRAME" ? logical_container_el.contentDocument : logical_container_el;
					const document = container_node.ownerDocument /*??*/ ||  container_node;
					// is this equivalent?
					// const document = logical_container_el.tagName == "IFRAME" ? logical_container_el.contentDocument : logical_container_el.ownerDocument;

					// console.log(`handling ${event.type} for container`, container_el);
					let newly_focused = event ? (event.type === "focusout" || event.type === "blur") ? event.relatedTarget : event.target : document.activeElement;
					if (event && event.type === "blur") {
						newly_focused = null; // only handle iframe
					}

					// console.log(`[${$w.title()}] (is_root=${is_root})`, `newly_focused is (preliminarily)`, element_to_string(newly_focused), `\nlogical_container_el`, logical_container_el, `\ncontainer_node`, container_node, `\ndocument.activeElement`, document.activeElement, `\ndocument.hasFocus()`, document.hasFocus(), `\ndocument`, document);

					// Iframes are stingy about focus events, so we need to check if focus is actually within an iframe.
					if (
						document.activeElement &&
						document.activeElement.tagName === "IFRAME" &&
						(event && event.type === "focusout" || event && event.type === "blur") &&
						!newly_focused // doesn't exist for security reasons in this case
					) {
						newly_focused = document.activeElement;
						// console.log(`[${$w.title()}] (is_root=${is_root})`, `newly_focused is (actually)`, element_to_string(newly_focused));
					}

					const outside_or_at_exactly =
						!newly_focused ||
						// contains() only works with DOM nodes (elements and documents), not window objects.
						// Since container_node is a DOM node, it will never have a Window inside of it (ignoring iframes).
						newly_focused.window === newly_focused || // is a Window object (cross-frame test)
						!container_node.contains(newly_focused); // Note: node.contains(node) === true
					const firmly_outside = outside_or_at_exactly && container_node !== newly_focused;

					// console.log(`[${$w.title()}] (is_root=${is_root})`, `outside_or_at_exactly=${outside_or_at_exactly}`, `firmly_outside=${firmly_outside}`);
					if (firmly_outside && is_root) {
						stopShowingAsFocused();
					}
					if (
						!outside_or_at_exactly &&
						newly_focused.tagName !== "HTML" &&
						newly_focused.tagName !== "BODY" &&
						newly_focused !== container_node &&
						!newly_focused.matches(".window-content") &&
						!newly_focused.closest(".menus") &&
						!newly_focused.closest(".window-titlebar")
					) {
						last_focus_by_container.set(logical_container_el, newly_focused); // overwritten for iframes below
						debug_focus_tracking(document, container_node, newly_focused, is_root);
					}

					if (
						!outside_or_at_exactly &&
						newly_focused.tagName === "IFRAME"
					) {
						const iframe = newly_focused;
						// console.log("iframe", iframe, onfocusin_by_container.has(iframe));
						try {
							const focus_in_iframe = iframe.contentDocument.activeElement;
							if (
								focus_in_iframe &&
								focus_in_iframe.tagName !== "HTML" &&
								focus_in_iframe.tagName !== "BODY" &&
								!focus_in_iframe.closest(".menus")
							) {
								// last_focus_by_container.set(logical_container_el, iframe); // done above
								last_focus_by_container.set(iframe, focus_in_iframe);
								debug_focus_tracking(iframe.contentDocument, iframe.contentDocument, focus_in_iframe, is_root);
							}
						} catch (e) {
							warn_iframe_access(iframe, e);
						}
					}


					// For child windows and menu popups, follow "semantic parent" chain.
					// Menu popups and child windows aren't descendants of the window they belong to,
					// but should keep the window shown as focused.
					// (In principle this sort of feature could be useful for focus tracking*,
					// but right now it's only for child windows and menu popups, which should not be tracked for refocus,
					// so I'm doing this after last_focus_by_container.set, for now anyway.)
					// ((*: and it may even be surprising if it doesn't work, if one sees the attribute on menus and attempts to use it.
					// But who's going to see that? The menus close so it's a pain to see the DOM structure! :P **))
					// (((**: without window.debugKeepMenusOpen)))
					if (is_root) {
						do {
							// if (!newly_focused?.closest) {
							// 	console.warn("what is this?", newly_focused);
							// 	break;
							// }
							const waypoint = newly_focused && newly_focused.closest && newly_focused.closest("[data-semantic-parent]");
							if (waypoint) {
								const id = waypoint.dataset.semanticParent;
								const parent = waypoint.ownerDocument.getElementById(id);
								// console.log("following semantic parent, from", newly_focused, "\nto", parent, "\nvia", waypoint);
								newly_focused = parent;
								if (!parent) {
									console.warn("semantic parent not found with id", id);
									break;
								}
							} else {
								break;
							}
						} while (true);
					}

					// Note: allowing showing window as focused from listeners inside iframe (non-root) too,
					// in order to handle clicking an iframe when the browser window was not previously focused (e.g. after reload)
					if (
						newly_focused &&
						newly_focused.window !== newly_focused && // cross-frame test for Window object
						container_node.contains(newly_focused)
					) {
						showAsFocused();
						$w.bringToFront();
						if (!is_root) {
							// trigger focusin events for iframes
							// @TODO: probably don't need showAsFocused() here since it'll be handled externally (on this simulated focusin),
							// and might not need a lot of other logic frankly if I'm simulating focusin events
							let el = logical_container_el;
							while (el) {
								// console.log("dispatching focusin event for", el);
								el.dispatchEvent(new Event("focusin", {
									bubbles: true,
									target: el,
									view: el.ownerDocument.defaultView,
								}));
								el = el.currentView && el.currentView.frameElement;
							}
						}
					} else if (is_root) {
						stopShowingAsFocused();
					}
				}
			}
			// initial state is unfocused
		}

		$w.css("touch-action", "none");

		let minimize_target_el = null; // taskbar button (optional)
		$w.setMinimizeTarget = function (new_taskbar_button_el) {
			minimize_target_el = new_taskbar_button_el;
		};

		let task;
		Object.defineProperty($w, "task", {
			get() {
				return task;
			},
			set(new_task) {
				console.warn("DEPRECATED: use $w.setMinimizeTarget(taskbar_button_el) instead of setting $window.task object");
				task = new_task;
			},
		});

		let before_minimize;
		$w.minimize = () => {
			minimize_target_el = minimize_target_el || task && task.$task[0];
			if (animating_titlebar) {
				when_done_animating_titlebar.push($w.minimize);
				return;
			}
			if ($w.is(":visible")) {
				if (minimize_target_el && !$w.hasClass("minimized-without-taskbar")) {
					const before_rect = $w.$titlebar[0].getBoundingClientRect();
					const after_rect = minimize_target_el.getBoundingClientRect();
					$w.animateTitlebar(before_rect, after_rect, () => {
						$w.hide();
						$w.blur();
					});
				} else {
					// no taskbar

					// @TODO: make this metrically similar to what Windows 98 does
					// @TODO: DRY! This is copied heavily from maximize()
					// @TODO: after minimize (without taskbar) and maximize, restore should restore original position before minimize
					// OR should it not maximize but restore the unmaximized state? I think I tested it but I forget.

					const to_width = 150;
					const spacing = 10;
					if ($w.hasClass("minimized-without-taskbar")) {
						// unminimizing
						minimize_slots[$w._minimize_slot_index] = null;
					} else {
						// minimizing
						let i = 0;
						while (minimize_slots[i]) {
							i++;
						}
						$w._minimize_slot_index = i;
						minimize_slots[i] = $w;
					}
					const to_x = $w._minimize_slot_index * (to_width + spacing) + 10;
					const titlebar_height = $w.$titlebar.outerHeight();
					let before_unminimize;
					const instantly_minimize = () => {
						before_minimize = {
							position: $w.css("position"),
							left: $w.css("left"),
							top: $w.css("top"),
							width: $w.css("width"),
							height: $w.css("height"),
						};

						$w.addClass("minimized-without-taskbar");
						if ($w.hasClass("maximized")) {
							$w.removeClass("maximized");
							$w.addClass("was-maximized");
							$w.$maximize.removeClass("window-action-restore");
							$w.$maximize.addClass("window-action-maximize");
						}
						$w.$minimize.removeClass("window-action-minimize");
						$w.$minimize.addClass("window-action-restore");
						if (before_unminimize) {
							$w.css({
								position: before_unminimize.position,
								left: before_unminimize.left,
								top: before_unminimize.top,
								width: before_unminimize.width,
								height: before_unminimize.height,
							});
						} else {
							$w.css({
								position: "fixed",
								top: `calc(100% - ${titlebar_height + 5}px)`,
								left: to_x,
								width: to_width,
								height: titlebar_height,
							});
						}
					};
					const instantly_unminimize = () => {
						before_unminimize = {
							position: $w.css("position"),
							left: $w.css("left"),
							top: $w.css("top"),
							width: $w.css("width"),
							height: $w.css("height"),
						};

						$w.removeClass("minimized-without-taskbar");
						if ($w.hasClass("was-maximized")) {
							$w.removeClass("was-maximized");
							$w.addClass("maximized");
							$w.$maximize.removeClass("window-action-maximize");
							$w.$maximize.addClass("window-action-restore");
						}
						$w.$minimize.removeClass("window-action-restore");
						$w.$minimize.addClass("window-action-minimize");
						$w.css({ width: "", height: "" });
						if (before_minimize) {
							$w.css({
								position: before_minimize.position,
								left: before_minimize.left,
								top: before_minimize.top,
								width: before_minimize.width,
								height: before_minimize.height,
							});
						}
					};

					const before_rect = $w.$titlebar[0].getBoundingClientRect();
					let after_rect;
					$w.css("transform", "");
					if ($w.hasClass("minimized-without-taskbar")) {
						instantly_unminimize();
						after_rect = $w.$titlebar[0].getBoundingClientRect();
						instantly_minimize();
					} else {
						instantly_minimize();
						after_rect = $w.$titlebar[0].getBoundingClientRect();
						instantly_unminimize();
					}
					$w.animateTitlebar(before_rect, after_rect, () => {
						if ($w.hasClass("minimized-without-taskbar")) {
							instantly_unminimize();
						} else {
							instantly_minimize();
							$w.blur();
						}
					});
				}
			}
		};
		$w.unminimize = () => {
			if (animating_titlebar) {
				when_done_animating_titlebar.push($w.unminimize);
				return;
			}
			if ($w.hasClass("minimized-without-taskbar")) {
				$w.minimize();
				return;
			}
			if ($w.is(":hidden")) {
				const before_rect = minimize_target_el.getBoundingClientRect();
				$w.show();
				const after_rect = $w.$titlebar[0].getBoundingClientRect();
				$w.hide();
				$w.animateTitlebar(before_rect, after_rect, () => {
					$w.show();
					$w.bringToFront();
					$w.focus();
				});
			}
		};

		let before_maximize;
		$w.maximize = () => {
			if (!options.resizable) {
				return;
			}
			if (animating_titlebar) {
				when_done_animating_titlebar.push($w.maximize);
				return;
			}
			if ($w.hasClass("minimized-without-taskbar")) {
				$w.minimize();
				return;
			}

			const instantly_maximize = () => {
				before_maximize = {
					position: $w.css("position"),
					left: $w.css("left"),
					top: $w.css("top"),
					width: $w.css("width"),
					height: $w.css("height"),
				};

				$w.addClass("maximized");
				const $taskbar = $(".taskbar");
				const scrollbar_width = window.innerWidth - $(window).width();
				const scrollbar_height = window.innerHeight - $(window).height();
				const taskbar_height = $taskbar.length ? $taskbar.outerHeight() + 1 : 0;
				$w.css({
					position: "fixed",
					top: 0,
					left: 0,
					width: `calc(100vw - ${scrollbar_width}px)`,
					height: `calc(100vh - ${scrollbar_height}px - ${taskbar_height}px)`,
				});
			};
			const instantly_unmaximize = () => {
				$w.removeClass("maximized");
				$w.css({ width: "", height: "" });
				if (before_maximize) {
					$w.css({
						position: before_maximize.position,
						left: before_maximize.left,
						top: before_maximize.top,
						width: before_maximize.width,
						height: before_maximize.height,
					});
				}
			};

			const before_rect = $w.$titlebar[0].getBoundingClientRect();
			let after_rect;
			$w.css("transform", "");
			const restoring = $w.hasClass("maximized");
			if (restoring) {
				instantly_unmaximize();
				after_rect = $w.$titlebar[0].getBoundingClientRect();
				instantly_maximize();
			} else {
				instantly_maximize();
				after_rect = $w.$titlebar[0].getBoundingClientRect();
				instantly_unmaximize();
			}
			$w.animateTitlebar(before_rect, after_rect, () => {
				if (restoring) {
					instantly_unmaximize(); // finalize in some way
					$w.$maximize.removeClass("window-action-restore");
					$w.$maximize.addClass("window-action-maximize");
				} else {
					instantly_maximize(); // finalize in some way
					$w.$maximize.removeClass("window-action-maximize");
					$w.$maximize.addClass("window-action-restore");
				}
			});
		};
		$w.restore = () => {
			if ($w.is(".minimized-without-taskbar, .minimized")) {
				$w.unminimize();
			} else if ($w.is(".maximized")) {
				$w.maximize();
			}
		};
		// must not pass event to functions by accident; also methods may not be defined yet
		$w.$minimize && $w.$minimize.on("click", (e)=> { $w.minimize(); });
		$w.$maximize && $w.$maximize.on("click", (e)=> { $w.maximize(); });
		$w.$x && $w.$x.on("click", (e)=> { $w.close(); });
		$w.$title_area.on("dblclick", (e)=> { $w.maximize(); });

		$w.css({
			position: "absolute",
			zIndex: $Window.Z_INDEX++
		});
		$w.bringToFront = () => {
			$w.css({
				zIndex: $Window.Z_INDEX++
			});
			for (const $childWindow of child_$windows) {
				$childWindow.bringToFront();
			}
		};

		// Keep track of last focused elements per container,
		// where containers include:
		// - window (global focus tracking)
		// - $w[0] (window-local, for restoring focus when refocusing window)
		// - any iframes that are same-origin (for restoring focus when refocusing window)
		// @TODO: should these be WeakMaps? probably.
		// @TODO: share this Map between all windows? but clean it up when destroying windows? or would a WeakMap take care of that?
		var last_focus_by_container = new Map(); // element to restore focus to, by container
		var focus_update_handlers_by_container = new Map(); // event handlers by container; note use as a flag to avoid adding multiple handlers
		var debug_svg_by_container = new Map(); // visualization
		var debug_svgs_in_window = []; // visualization
		var warned_iframes = new WeakSet(); // prevent spamming console

		const warn_iframe_access = (iframe, error) => {
			const log_template = (message) => [`OS-GUI.js failed to access an iframe (${element_to_string(iframe)}) for focus integration.
	${message}
	Original error:
	`, error];

			let cross_origin;
			if (iframe.srcdoc) {
				cross_origin = false;
			} else {
				try {
					const url = new URL(iframe.src);
					cross_origin = url.origin !== window.location.origin; // shouldn't need to use iframe.ownerDocument.location.origin because intermediate iframes must be same-origin
				} catch (parse_error) {
					console.error(...log_template(`This may be a bug in OS-GUI. Is this a cross-origin iframe? Failed to parse URL (${parse_error}).`));
					return;
				}
			}
			if (cross_origin) {
				if (options.iframes && options.iframes.ignoreCrossOrigin && !warned_iframes.has(iframe)) {
					console.warn(...log_template(`Only same-origin iframes can work with focus integration (showing window as focused, refocusing last focused controls).
	If you can re-host the content on the same origin, you can resolve this and enable focus integration.
	You can also disable this warning by passing {iframes: {ignoreCrossOrigin: true}} to $Window.`));
					warned_iframes.add(iframe);
				}
			} else {
				console.error(...log_template(`This may be a bug in OS-GUI, since it doesn't appear to be a cross-origin iframe.`));
			}
		};

		const debug_focus_tracking = (document, container_el, descendant_el, is_root) => {
			if (!$Window.DEBUG_FOCUS) {
				return;
			}
			let svg = debug_svg_by_container.get(container_el);
			if (!svg) {
				svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
				svg.style.position = "fixed";
				svg.style.top = "0";
				svg.style.left = "0";
				svg.style.width = "100%";
				svg.style.height = "100%";
				svg.style.pointerEvents = "none";
				svg.style.zIndex = "100000000";
				svg.style.direction = "ltr"; // position labels correctly
				debug_svg_by_container.set(container_el, svg);
				debug_svgs_in_window.push(svg);
				document.body.appendChild(svg);
			}
			svg._container_el = container_el;
			svg._descendant_el = descendant_el;
			svg._is_root = is_root;
			animate_debug_focus_tracking();
		};
		const update_debug_focus_tracking = (svg) => {
			const container_el = svg._container_el;
			const descendant_el = svg._descendant_el;
			const is_root = svg._is_root;

			while (svg.lastChild) {
				svg.removeChild(svg.lastChild);
			}
			const descendant_rect = descendant_el.getBoundingClientRect && descendant_el.getBoundingClientRect() ||/*??*/ { left: 0, top: 0, width: innerWidth, height: innerHeight, right: innerWidth, bottom: innerHeight };
			const container_rect = container_el.getBoundingClientRect && ontainer_el.getBoundingClientRect() ||/*??*/ { left: 0, top: 0, width: innerWidth, height: innerHeight, right: innerWidth, bottom: innerHeight };
			// draw rectangles with labels
			for (const rect of [descendant_rect, container_rect]) {
				const rect_el = document.createElementNS("http://www.w3.org/2000/svg", "rect");
				rect_el.setAttribute("x", rect.left);
				rect_el.setAttribute("y", rect.top);
				rect_el.setAttribute("width", rect.width);
				rect_el.setAttribute("height", rect.height);
				rect_el.setAttribute("stroke", rect === descendant_rect ? "#f44" : "#f44");
				rect_el.setAttribute("stroke-width", "2");
				rect_el.setAttribute("fill", "none");
				if (!is_root) {
					rect_el.setAttribute("stroke-dasharray", "5,5");
				}
				svg.appendChild(rect_el);
				const text_el = document.createElementNS("http://www.w3.org/2000/svg", "text");
				text_el.setAttribute("x", rect.left);
				text_el.setAttribute("y", rect.top + (rect === descendant_rect ? 20 : 0)); // align container text on outside, descendant text on inside
				text_el.setAttribute("fill", rect === descendant_rect ? "#f44" : "aqua");
				text_el.setAttribute("font-size", "20");
				text_el.style.textShadow = "1px 1px 1px black, 0 0 10px black";
				text_el.textContent = element_to_string(rect === descendant_rect ? descendant_el : container_el);
				svg.appendChild(text_el);
			}
			// draw lines connecting the two rects
			const lines = [
				[descendant_rect.left, descendant_rect.top, container_rect.left, container_rect.top],
				[descendant_rect.right, descendant_rect.top, container_rect.right, container_rect.top],
				[descendant_rect.left, descendant_rect.bottom, container_rect.left, container_rect.bottom],
				[descendant_rect.right, descendant_rect.bottom, container_rect.right, container_rect.bottom],
			];
			for (const line of lines) {
				const line_el = document.createElementNS("http://www.w3.org/2000/svg", "line");
				line_el.setAttribute("x1", line[0]);
				line_el.setAttribute("y1", line[1]);
				line_el.setAttribute("x2", line[2]);
				line_el.setAttribute("y2", line[3]);
				line_el.setAttribute("stroke", "green");
				line_el.setAttribute("stroke-width", "2");
				svg.appendChild(line_el);
			}
		};
		let debug_animation_frame_id;
		const animate_debug_focus_tracking = () => {
			cancelAnimationFrame(debug_animation_frame_id);
			if (!$Window.DEBUG_FOCUS) {
				clean_up_debug_focus_tracking();
				return;
			}
			debug_animation_frame_id = requestAnimationFrame(animate_debug_focus_tracking);
			for (const svg of debug_svgs_in_window) {
				update_debug_focus_tracking(svg);
			}
		};
		const clean_up_debug_focus_tracking = () => {
			cancelAnimationFrame(debug_animation_frame_id);
			for (const svg of debug_svgs_in_window) {
				svg.remove();
			}
			debug_svgs_in_window.length = 0;
			debug_svg_by_container.clear();
		};

		const refocus = (container_el = $w.$content[0]) => {
			const logical_container_el = container_el.matches(".window-content") ? $w[0] : container_el;
			const last_focus = last_focus_by_container.get(logical_container_el);
			if (last_focus) {
				last_focus.focus({ preventScroll: true });
				if (last_focus.tagName === "IFRAME") {
					try {
						refocus(last_focus);
					} catch (e) {
						warn_iframe_access(last_focus, e);
					}
				}
				return;
			}
			const $tabstops = find_tabstops(container_el);
			const $default = $tabstops.filter(".default");
			if ($default.length) {
				$default[0].focus({ preventScroll: true });
				return;
			}
			if ($tabstops.length) {
				if ($tabstops[0].tagName === "IFRAME") {
					try {
						refocus($tabstops[0]); // not .contentDocument.body because we want the container tracked by last_focus_by_container
					} catch (e) {
						warn_iframe_access($tabstops[0], e);
					}
				} else {
					$tabstops[0].focus({ preventScroll: true });
				}
				return;
			}
			if (options.toolWindow && options.parentWindow) {
				options.parentWindow.triggerHandler("refocus-window");
				return;
			}
			container_el.focus({ preventScroll: true });
			if (container_el.tagName === "IFRAME") {
				try {
					refocus(container_el.contentDocument.body);
				} catch (e) {
					warn_iframe_access(container_el, e);
				}
			}
		};

		$w.on("refocus-window", () => {
			refocus();
		});

		// redundant events are for handling synthetic events,
		// which may be sent individually, rather than in tandem
		$w.on("pointerdown mousedown", handle_pointer_activation);
		// Note that jQuery treats some events differently, and can't listen for some synthetic events
		// but pointerdown and mousedown seem to be supported. That said, if you trigger() either,
		// addEventListener() handlers will not be called. So if I remove the dependency on jQuery,
		// it will not be possible to listen for some .trigger() events.
		// https://jsfiddle.net/1j01/ndvwts9y/1/

		// Assumption: focusin comes after pointerdown/mousedown
		// This is probably guaranteed, because you can prevent the default of focusing from pointerdown/mousedown
		$G.on("focusin", (e) => {
			last_focus_by_container.set(window, e.target);
			// debug_focus_tracking(document, window, e.target);
		});

		function handle_pointer_activation(event) {
			// console.log("handle_pointer_activation", event.type, event.target);
			$w.bringToFront();
			// Test cases where it should refocus the last focused control in the window:
			// - Click in the blank space of the window
			//   - Click in blank space again now that something's focused
			// - Click on the window title bar
			//   - Click on title bar buttons
			// - Closing a second window should focus the first window
			//   - Open a dialog window from an app window that has a tool window, then close the dialog window
			//     - @TODO: Even if the tool window has controls, it should focus the parent window, I think
			// - Clicking on a control in the window should focus said control
			// - Clicking on a disabled control in the window should focus the window
			//   - Make sure to test this with another window previously focused
			// - Simulated clicks (important for JS Paint's eye gaze and speech recognition modes)
			// - (@TODO: Should clicking a child window focus the parent window?)
			// - After potentially selecting text but not selecting anything
			// It should NOT refocus when:
			// - Clicking on a control in a different window
			// - When other event handlers set focus
			//   - Using the keyboard to focus something outside the window, such as a menu popup
			//   - Clicking a control that focuses something outside the window
			//     - Button that opens another window (e.g. Recursive Dialog button in tests)
			//     - Button that focuses a control in another window (e.g. Focus Other button in tests)
			// - Trying to select text

			// Wait for other pointerdown handlers and default behavior, and focusin events.
			requestAnimationFrame(() => {
				const last_focus_global = last_focus_by_container.get(window);
				// const last_focus_in_window = last_focus_by_container.get($w.$content[0]);
				// console.log("a tick after", event.type, { last_focus_in_window, last_focus_global, activeElement: document.activeElement, win_elem: $w[0] });
				// console.log("did focus change?", document.activeElement !== last_focus_global);

				// If something programmatically got focus, don't refocus.
				if (
					document.activeElement &&
					document.activeElement !== document &&
					document.activeElement !== document.body &&
					document.activeElement !== $w.$content[0] &&
					document.activeElement !== last_focus_global
				) {
					return;
				}
				// If menus got focus, don't refocus.
				if (document.activeElement && document.activeElement.closest && document.activeElement.closest(".menus, .menu-popup")) {
					// console.log("click in menus");
					return;
				}

				// If the element is selectable, wait until the click is done and see if anything was selected first.
				// This is a bit of a weird compromise, for now.
				const target_style = getComputedStyle(event.target);
				if (target_style.userSelect !== "none") {
					// Immediately show the window as focused, just don't refocus a specific control.
					$w.$content.focus();

					$w.one("pointerup pointercancel", () => {
						requestAnimationFrame(() => { // this seems to make it more reliable in regards to double clicking
							if (!getSelection().toString().trim()) {
								refocus();
							}
						});
					});
					return;
				}
				// Set focus to the last focused control, which should be updated if a click just occurred.
				refocus();
			});
		}

		$w.on("keydown", (e) => {
			if (e.isDefaultPrevented()) {
				return;
			}
			if (e.ctrlKey || e.altKey || e.metaKey) {
				return;
			}
			// console.log("keydown", e.key, e.target);
			if (e.target.closest(".menus")) {
				// console.log("keydown in menus");
				return;
			}
			const $buttons = $w.$content.find("button");
			const $focused = $(document.activeElement);
			const focused_index = $buttons.index($focused);
			switch (e.keyCode) {
				case 40: // Down
				case 39: // Right
					if ($focused.is("button") && !e.shiftKey) {
						if (focused_index < $buttons.length - 1) {
							$buttons[focused_index + 1].focus();
							e.preventDefault();
						}
					}
					break;
				case 38: // Up
				case 37: // Left
					if ($focused.is("button") && !e.shiftKey) {
						if (focused_index > 0) {
							$buttons[focused_index - 1].focus();
							e.preventDefault();
						}
					}
					break;
				case 32: // Space
				case 13: // Enter (doesn't actually work in chrome because the button gets clicked immediately)
					if ($focused.is("button") && !e.shiftKey) {
						$focused.addClass("pressed");
						const release = () => {
							$focused.removeClass("pressed");
							$focused.off("focusout", release);
							$(window).off("keyup", keyup);
						};
						const keyup = (e) => {
							if (e.keyCode === 32 || e.keyCode === 13) {
								release();
							}
						};
						$focused.on("focusout", release);
						$(window).on("keyup", keyup);
					}
					break;
				case 9: { // Tab
					// wrap around when tabbing through controls in a window
					const $controls = find_tabstops($w.$content[0]);
					if ($controls.length > 0) {
						const focused_control_index = $controls.index($focused);
						if (e.shiftKey) {
							if (focused_control_index === 0) {
								e.preventDefault();
								$controls[$controls.length - 1].focus();
							}
						} else {
							if (focused_control_index === $controls.length - 1) {
								e.preventDefault();
								$controls[0].focus();
							}
						}
					}
					break;
				}
				case 27: // Escape
					// @TODO: make this optional, and probably default false
					$w.close();
					break;
			}
		});

		$w.applyBounds = () => {
			// TODO: outerWidth vs width? not sure
			const bound_width = Math.max(document.body.scrollWidth, innerWidth);
			const bound_height = Math.max(document.body.scrollHeight, innerHeight);
			$w.css({
				left: Math.max(0, Math.min(bound_width - $w.width(), $w.position().left)),
				top: Math.max(0, Math.min(bound_height - $w.height(), $w.position().top)),
			});
		};

		$w.bringTitleBarInBounds = () => {
			// Try to make the titlebar always accessible
			const bound_width = Math.max(document.body.scrollWidth, innerWidth);
			const bound_height = Math.max(document.body.scrollHeight, innerHeight);
			const min_horizontal_pixels_on_screen = 40; // enough for space past a close button
			$w.css({
				left: Math.max(
					min_horizontal_pixels_on_screen - $w.outerWidth(),
					Math.min(
						bound_width - min_horizontal_pixels_on_screen,
						$w.position().left
					)
				),
				top: Math.max(0, Math.min(
					bound_height - $w.$titlebar.outerHeight() - 5,
					$w.position().top
				)),
			});
		};

		$w.center = () => {
			$w.css({
				left: (innerWidth - $w.width()) / 2 + window.scrollX,
				top: (innerHeight - $w.height()) / 2 + window.scrollY,
			});
			$w.applyBounds();
		};


		$G.on("resize", $w.bringTitleBarInBounds);

		var drag_offset_x, drag_offset_y, drag_pointer_x, drag_pointer_y, drag_pointer_id;
		var update_drag = (e) => {
			if (drag_pointer_id === (e.pointerId ||/*??*/ e.originalEvent.pointerId)) {
				drag_pointer_x = e.clientX ||/*??*/ drag_pointer_x;
				drag_pointer_y = e.clientY ||/*??*/ drag_pointer_y;
			}
			$w.css({
				left: drag_pointer_x + scrollX - drag_offset_x,
				top: drag_pointer_y + scrollY - drag_offset_y,
			});
		};
		$w.$titlebar.css("touch-action", "none");
		$w.$titlebar.on("selectstart", (e) => { // preventing mousedown would break :active state, I'm not sure if just selectstart is enough...
			e.preventDefault();
		});
		$w.$titlebar.on("mousedown", "button", (e) => {
			// Prevent focus on titlebar buttons.
			// This can break the :active state. In Firefox, a setTimeout before any focus() was enough,
			// but now in Chrome 95, focus() breaks the :active state too, and setTimeout only delays the brokenness,
			// so I have to use a CSS class now for the pressed state.
			refocus();
			// Emulate :enabled:active:hover state with .pressing class
			const button = e.currentTarget;
			if (!$(button).is(":enabled")) {
				return;
			}
			button.classList.add("pressing");
			const release = (event) => {
				// blur is just to handle the edge case of alt+tabbing/ctrl+tabbing away
				if (event && event.type === "blur") {
					// if (document.activeElement?.tagName === "IFRAME") {
					if (document.hasFocus()) {
						return; // the window isn't really blurred; an iframe got focus
					}
				}
				button.classList.remove("pressing");
				$G.off("mouseup blur", release);
				$(button).off("mouseenter", on_mouse_enter);
				$(button).off("mouseleave", on_mouse_leave);
			};
			const on_mouse_enter = () => { button.classList.add("pressing"); };
			const on_mouse_leave = () => { button.classList.remove("pressing"); };
			$G.on("mouseup blur", release);
			$(button).on("mouseenter", on_mouse_enter);
			$(button).on("mouseleave", on_mouse_leave);
		});
		$w.$titlebar.on("pointerdown", (e) => {
			if ($(e.target).closest("button").length) {
				return;
			}
			if ($w.hasClass("maximized")) {
				return;
			}
			const customEvent = $.Event("window-drag-start");
			$w.trigger(customEvent);
			if (customEvent.isDefaultPrevented()) {
				return; // allow custom drag behavior of component windows in jspaint (Tools / Colors)
			}
			drag_offset_x = e.clientX + scrollX - $w.position().left;
			drag_offset_y = e.clientY + scrollY - $w.position().top;
			drag_pointer_x = e.clientX;
			drag_pointer_y = e.clientY;
			drag_pointer_id = (e.pointerId ||/*??*/ e.originalEvent.pointerId);
			$G.on("pointermove", update_drag);
			$G.on("scroll", update_drag);
			$("body").addClass("dragging"); // for when mouse goes over an iframe
		});
		$G.on("pointerup pointercancel", (e) => {
			if ((e.pointerId ||/*??*/ e.originalEvent.pointerId) !== drag_pointer_id) { return; }
			$G.off("pointermove", update_drag);
			$G.off("scroll", update_drag);
			$("body").removeClass("dragging");
			// $w.applyBounds(); // Windows doesn't really try to keep windows on screen
			// but you also can't really drag off of the desktop, whereas here you can drag to way outside the web page.
			$w.bringTitleBarInBounds();
			drag_pointer_id = -1; // prevent bringTitleBarInBounds from making the window go to top left when unminimizing window from taskbar after previously dragging it
		});
		$w.$titlebar.on("dblclick", (e) => {
			if ($component) {
				$component.dock();
			}
		});

		if (options.resizable) {

			const HANDLE_MIDDLE = 0;
			const HANDLE_START = -1;
			const HANDLE_END = 1;
			const HANDLE_LEFT = HANDLE_START;
			const HANDLE_RIGHT = HANDLE_END;
			const HANDLE_TOP = HANDLE_START;
			const HANDLE_BOTTOM = HANDLE_END;

			[
				[HANDLE_TOP, HANDLE_RIGHT], // ↗
				[HANDLE_TOP, HANDLE_MIDDLE], // ↑
				[HANDLE_TOP, HANDLE_LEFT], // ↖
				[HANDLE_MIDDLE, HANDLE_LEFT], // ←
				[HANDLE_BOTTOM, HANDLE_LEFT], // ↙
				[HANDLE_BOTTOM, HANDLE_MIDDLE], // ↓
				[HANDLE_BOTTOM, HANDLE_RIGHT], // ↘
				[HANDLE_MIDDLE, HANDLE_RIGHT], // →
			].forEach(([y_axis, x_axis]) => {
				// const resizes_height = y_axis !== HANDLE_MIDDLE;
				// const resizes_width = x_axis !== HANDLE_MIDDLE;
				const $handle = $("<div>").addClass("handle").appendTo($w);

				let cursor = "";
				if (y_axis === HANDLE_TOP) { cursor += "n"; }
				if (y_axis === HANDLE_BOTTOM) { cursor += "s"; }
				if (x_axis === HANDLE_LEFT) { cursor += "w"; }
				if (x_axis === HANDLE_RIGHT) { cursor += "e"; }
				cursor += "-resize";

				// Note: MISNOMER: innerWidth() is less "inner" than width(), because it includes padding!
				// Here's a little diagram of sorts:
				// outerWidth(true): margin, [ outerWidth(): border, [ innerWidth(): padding, [ width(): content ] ] ]
				const handle_thickness = ($w.outerWidth() - $w.width()) / 2; // padding + border
				const border_width = ($w.outerWidth() - $w.innerWidth()) / 2; // border; need to outset the handles by this amount so they overlap the border + padding, and not the content
				const window_frame_height = $w.outerHeight() - $w.$content.outerHeight(); // includes titlebar and borders, padding, but not content
				const window_frame_width = $w.outerWidth() - $w.$content.outerWidth(); // includes borders, padding, but not content
				$handle.css({
					position: "absolute",
					top: y_axis === HANDLE_TOP ? -border_width : y_axis === HANDLE_MIDDLE ? `calc(${handle_thickness}px - ${border_width}px)` : "",
					bottom: y_axis === HANDLE_BOTTOM ? -border_width : "",
					left: x_axis === HANDLE_LEFT ? -border_width : x_axis === HANDLE_MIDDLE ? `calc(${handle_thickness}px - ${border_width}px)` : "",
					right: x_axis === HANDLE_RIGHT ? -border_width : "",
					width: x_axis === HANDLE_MIDDLE ? `calc(100% - ${handle_thickness}px * 2 + ${border_width * 2}px)` : `${handle_thickness}px`,
					height: y_axis === HANDLE_MIDDLE ? `calc(100% - ${handle_thickness}px * 2 + ${border_width * 2}px)` : `${handle_thickness}px`,
					// background: x_axis === HANDLE_MIDDLE || y_axis === HANDLE_MIDDLE ? "rgba(255,0,0,0.4)" : "rgba(0,255,0,0.8)",
					touchAction: "none",
					cursor,
				});

				let rect;
				let resize_offset_x, resize_offset_y, resize_pointer_x, resize_pointer_y, resize_pointer_id;
				$handle.on("pointerdown", (e) => {
					e.preventDefault();

					$G.on("pointermove", handle_pointermove);
					$G.on("scroll", update_resize); // scroll doesn't have clientX/Y, so we have to remember it
					$("body").addClass("dragging"); // for when mouse goes over an iframe
					$G.on("pointerup pointercancel", end_resize);

					rect = {
						x: $w.position().left,
						y: $w.position().top,
						width: $w.outerWidth(),
						height: $w.outerHeight(),
					};

					resize_offset_x = e.clientX + scrollX - rect.x - (x_axis === HANDLE_RIGHT ? rect.width : 0);
					resize_offset_y = e.clientY + scrollY - rect.y - (y_axis === HANDLE_BOTTOM ? rect.height : 0);
					resize_pointer_x = e.clientX;
					resize_pointer_y = e.clientY;
					resize_pointer_id = (e.pointerId ||/*??*/ e.originalEvent.pointerId);

					$handle[0].setPointerCapture(resize_pointer_id); // keeps cursor consistent when mouse moves over other elements

					// handle_pointermove(e); // was useful for checking that the offset is correct (should not do anything, if it's correct!)
				});
				function handle_pointermove(e) {
					if ((e.pointerId ||/*??*/ e.originalEvent.pointerId) !== resize_pointer_id) { return; }
					resize_pointer_x = e.clientX;
					resize_pointer_y = e.clientY;
					update_resize();
				}
				function end_resize(e) {
					if ((e.pointerId ||/*??*/ e.originalEvent.pointerId) !== resize_pointer_id) { return; }
					$G.off("pointermove", handle_pointermove);
					$G.off("scroll", onscroll);
					$("body").removeClass("dragging");
					$G.off("pointerup pointercancel", end_resize);
					$w.bringTitleBarInBounds();
				}
				function update_resize() {
					const mouse_x = resize_pointer_x + scrollX - resize_offset_x;
					const mouse_y = resize_pointer_y + scrollY - resize_offset_y;
					let delta_x = 0;
					let delta_y = 0;
					let width, height;
					if (x_axis === HANDLE_RIGHT) {
						delta_x = 0;
						width = ~~(mouse_x - rect.x);
					} else if (x_axis === HANDLE_LEFT) {
						delta_x = ~~(mouse_x - rect.x);
						width = ~~(rect.x + rect.width - mouse_x);
					} else {
						width = ~~(rect.width);
					}
					if (y_axis === HANDLE_BOTTOM) {
						delta_y = 0;
						height = ~~(mouse_y - rect.y);
					} else if (y_axis === HANDLE_TOP) {
						delta_y = ~~(mouse_y - rect.y);
						height = ~~(rect.y + rect.height - mouse_y);
					} else {
						height = ~~(rect.height);
					}
					let new_rect = {
						x: rect.x + delta_x,
						y: rect.y + delta_y,
						width,
						height,
					};

					new_rect.width = Math.max(1, new_rect.width);
					new_rect.height = Math.max(1, new_rect.height);

					// Constraints
					if (options.constrainRect) {
						new_rect = options.constrainRect(new_rect, x_axis, y_axis);
					}
					new_rect.width = Math.max(new_rect.width, options.minOuterWidth ||/*??*/ 100);
					new_rect.height = Math.max(new_rect.height, options.minOuterHeight ||/*??*/ 0);
					new_rect.width = Math.max(new_rect.width, (options.minInnerWidth ||/*??*/ 0) + window_frame_width);
					new_rect.height = Math.max(new_rect.height, (options.minInnerHeight ||/*??*/ 0) + window_frame_height);
					// prevent free movement via resize past minimum size
					if (x_axis === HANDLE_LEFT) {
						new_rect.x = Math.min(new_rect.x, rect.x + rect.width - new_rect.width);
					}
					if (y_axis === HANDLE_TOP) {
						new_rect.y = Math.min(new_rect.y, rect.y + rect.height - new_rect.height);
					}

					$w.css({
						top: new_rect.y,
						left: new_rect.x,
					});
					$w.outerWidth(new_rect.width);
					$w.outerHeight(new_rect.height);
				}
			});
		}

		$w.$Button = (text, handler) => {
			var $b = $(E("button"))
				.appendTo($w.$content)
				.text(text)
				.on("click", () => {
					if (handler) {
						handler();
					}
					$w.close();
				});
			return $b;
		};
		$w.title = title => {
			if (title) {
				$w.$title.text(title);
				$w.trigger("title-change");
				if ($w.task) {
					$w.task.updateTitle();
				}
				return $w;
			} else {
				return $w.$title.text();
			}
		};
		$w.getTitle = () => {
			return $w.title();
		};
		let animating_titlebar = false;
		let when_done_animating_titlebar = []; // queue of functions to call when done animating,
		// so maximize() / minimize() / restore() eventually gives the same result as if there was no animation
		$w.animateTitlebar = (from, to, callback = () => { }) => {
			// flying titlebar animation
			animating_titlebar = true;
			const $eye_leader = $w.$titlebar.clone(true);
			$eye_leader.find("button").remove();
			$eye_leader.appendTo("body");
			const duration_ms = $Window.OVERRIDE_TRANSITION_DURATION ||/*??*/ 200; // TODO: how long?
			const duration_str = `${duration_ms}ms`;
			$eye_leader.css({
				transition: `left ${duration_str} linear, top ${duration_str} linear, width ${duration_str} linear, height ${duration_str} linear`,
				position: "fixed",
				zIndex: 10000000,
				pointerEvents: "none",
				left: from.left,
				top: from.top,
				width: from.width,
				height: from.height,
			});
			setTimeout(() => {
				$eye_leader.css({
					left: to.left,
					top: to.top,
					width: to.width,
					height: to.height,
				});
			}, 5);
			let handled_transition_completion = false;
			const handle_transition_completion = () => {
				if (handled_transition_completion) {
					return; // ignore multiple calls (an idempotency pattern)
				} else {
					handled_transition_completion = true;
				}
				animating_titlebar = false;
				$eye_leader.remove();
				callback();
				let anima = when_done_animating_titlebar.shift()
				anima && anima(); // relies on animating_titlebar = false;
			};
			$eye_leader.on("transitionend transitioncancel", handle_transition_completion);
			setTimeout(handle_transition_completion, duration_ms * 1.2);
		};
		$w.close = (force) => {
			if (force && force !== true) {
				throw new TypeError("force must be a boolean or undefined, not " + Object.prototype.toString.call(force));
			}
			if (!force) {
				var e = $.Event("close");
				$w.trigger(e);
				if (e.isDefaultPrevented()) {
					return;
				}
			}
			if ($component) {
				$component.detach();
			}
			$w.closed = true;
			$event_target.triggerHandler("closed");
			$w.trigger("closed");
			// TODO: change usages of "close" to "closed" where appropriate
			// and probably rename the "close" event ("before[-]close"? "may-close"? "close-request"?)

			// MUST be after any events are triggered!
			$w.remove();

			// TODO: support modals, which should focus what was focused before the modal was opened.
			// (Note: must consider the element being removed from the DOM, or hidden, or made un-focusable)
			// (Also: modals should steal focus / be brought to the front when focusing the parent window, and the parent window's content should be inert/uninteractive)
			
			// Focus next-topmost window
			var $next_topmost = $($(".window:visible").toArray().sort((a, b) => b.style.zIndex - a.style.zIndex)[0]);
			$next_topmost.triggerHandler("refocus-window");

			// Cleanup
			clean_up_debug_focus_tracking();
		};
		$w.closed = false;

		let current_menu_bar;
		// @TODO: should this be like setMenus(menu_definitions)?
		// It seems like setMenuBar(menu_bar) might be prone to bugs
		// trying to set the same menu bar on multiple windows.
		$w.setMenuBar = (menu_bar) => {
			// $w.find(".menus").remove(); // ugly, if only because of the class name haha
			if (current_menu_bar) {
				current_menu_bar.element.remove();
			}
			if (menu_bar) {
				$w.$titlebar.after(menu_bar.element);
				menu_bar.setKeyboardScope($w[0]);
				current_menu_bar = menu_bar;
			}
		};

		if (options.title) {
			$w.title(options.title);
		}

		if (!$component) {
			$w.center();
		}

		// mustHaveMethods($w, windowInterfaceMethods);

		return $w;
	}

	function $FormWindow(title) {
		var $w = new $Window();

		$w.title(title);
		$w.$form = $(E("form")).appendTo($w.$content);
		$w.$main = $(E("div")).appendTo($w.$form);
		$w.$buttons = $(E("div")).appendTo($w.$form).addClass("button-group");

		$w.$Button = (label, action) => {
			var $b = $(E("button")).appendTo($w.$buttons).text(label);
			$b.on("click", (e) => {
				// prevent the form from submitting
				// @TODO: instead, prevent the form's submit event
				e.preventDefault();

				action();
			});

			$b.on("pointerdown", () => {
				$b.focus();
			});

			return $b;
		};

		return $w;
	}

	$Window.$FormWindow = $FormWindow;
	
	return $Window;
});

define('skylark-98js/iframe-windows',[
	"skylark-jquery",
	"./win98",
	"./os-gui/$Window"
],function($,win98js,$Window){
	var programs_being_loaded = 0;

	var $G = $(window);
	
	function enhance_iframe(iframe) {
		var $iframe = $(iframe);

		$("body").addClass("loading-program");
		programs_being_loaded += 1;

		$iframe.on("load", function () {

			if (--programs_being_loaded <= 0) {
				$("body").removeClass("loading-program");
			}

			try {
				console.assert(iframe.contentWindow.document === iframe.contentDocument); // just something that won't get optimized away if we were to ever use a minifier (or by the JIT compiler??)
			} catch (e) {
				console.warn(`[enhance_iframe] iframe integration is not available for '${iframe.src}'`);
				return;
			}

			if (window.themeCSSProperties) {
				applyTheme(themeCSSProperties, iframe.contentDocument.documentElement);
			}

			// Let the iframe to handle mouseup events outside itself
			// (without using setPointerCapture)
			iframe.contentDocument.addEventListener("mousedown", (event) => {
				var delegate_pointerup = function () {
					if (iframe.contentWindow && iframe.contentWindow.jQuery) {
						iframe.contentWindow.jQuery("body").trigger("pointerup");
					}
					if (iframe.contentWindow) {
						const event = new iframe.contentWindow.MouseEvent("mouseup", { button: 0 });
						iframe.contentWindow.dispatchEvent(event);
						const event2 = new iframe.contentWindow.MouseEvent("mouseup", { button: 2 });
						iframe.contentWindow.dispatchEvent(event2);
					}
					clean_up_delegation();
				};
				// @TODO: delegate pointermove events too?
				// @TODO: do delegation in os-gui.js library instead
				// is it delegation? I think I mean proxying (but I'm really tired and don't have internet right now so I can't say for sure haha)

				$G.on("mouseup blur", delegate_pointerup);
				iframe.contentDocument.addEventListener("mouseup", clean_up_delegation);
				function clean_up_delegation() {
					$G.off("mouseup blur", delegate_pointerup);
					iframe.contentDocument.removeEventListener("mouseup", clean_up_delegation);
				}
			});

			// Let the containing page handle keyboard events, with an opportunity to cancel them
			proxy_keyboard_events(iframe);

			// on Wayback Machine, and iframe's url not saved yet
			if (iframe.contentDocument.querySelector("#error #livewebInfo.available")) {
				var message = document.createElement("div");
				message.style.position = "absolute";
				message.style.left = "0";
				message.style.right = "0";
				message.style.top = "0";
				message.style.bottom = "0";
				message.style.background = "#c0c0c0";
				message.style.color = "#000";
				message.style.padding = "50px";
				iframe.contentDocument.body.appendChild(message);
				message.innerHTML = `<a target="_blank">Save this url in the Wayback Machine</a>`;
				message.querySelector("a").href =
					"https://web.archive.org/save/https://98.js.org/" +
					iframe.src.replace(/.*https:\/\/98.js.org\/?/, "");
				message.querySelector("a").style.color = "blue";
			}

			var $contentWindow = $(iframe.contentWindow);
			$contentWindow.on("pointerdown click", function (e) {
				iframe.$window && iframe.$window.focus();

				// from close_menus in $MenuBar
				$(".menu-button").trigger("release");
				// Close any rogue floating submenus
				$(".menu-popup").hide();
			});
			// We want to disable pointer events for other iframes, but not this one
			$contentWindow.on("pointerdown", function (e) {
				$iframe.css("pointer-events", "all");
				$("body").addClass("drag");
			});
			$contentWindow.on("pointerup", function (e) {
				$("body").removeClass("drag");
				$iframe.css("pointer-events", "");
			});
			// $("iframe").css("pointer-events", ""); is called elsewhere.
			// Otherwise iframes would get stuck in this interaction mode

			iframe.contentWindow.close = function () {
				iframe.$window && iframe.$window.close();
			};
			// TODO: hook into saveAs (a la FileSaver.js) and another function for opening files
			// iframe.contentWindow.saveAs = function(){
			// 	saveAsDialog();
			// };

			// Don't override alert (except within the specific pages)
			// but override the underlying message box function that
			// the alert override uses, so that the message boxes can
			// go outside the window.
			iframe.contentWindow.showMessageBox = (options) => {
				return showMessageBox({
					title: options.title /*??*/ ||  iframe.contentWindow.defaultMessageBoxTitle,
					...options,
				});
			};
		});
		$iframe.css({
			minWidth: 0,
			minHeight: 0, // overrides user agent styling apparently, fixes Sound Recorder
			flex: 1,
			border: 0, // overrides user agent styling
		});
	}

	// Let the containing page handle keyboard events, with an opportunity to cancel them
	function proxy_keyboard_events(iframe) {
		// Note: iframe must be same-origin, or this will fail.
		for (const event_type of ["keyup", "keydown", "keypress"]) {
			iframe.contentWindow.addEventListener(event_type, (event) => {
				const proxied_event = new KeyboardEvent(event_type, {
					target: iframe,
					view: iframe.ownerDocument.defaultView,
					bubbles: true,
					cancelable: true,
					key: event.key,
					keyCode: event.keyCode,
					which: event.which,
					code: event.code,
					shiftKey: event.shiftKey,
					ctrlKey: event.ctrlKey,
					metaKey: event.metaKey,
					altKey: event.altKey,
					repeat: event.repeat,
					//...@TODO: should it copy ALL properties?
				});
				const result = iframe.dispatchEvent(proxied_event);
				// console.log("proxied", event, "as", proxied_event, "result", result);
				if (!result) {
					event.preventDefault();
				}
			}, true);
		}
	}

	function make_iframe_window(options) {
		///options.resizable ??= true;
		if (options.resizable == undefined) {
			options.resizable = true;
		}
		var $win = new $Window(options);

		var $iframe = $win.$iframe = $("<iframe>").attr({ src: options.src });
		enhance_iframe($iframe[0]);
		$win.$content.append($iframe);
		var iframe = $win.iframe = $iframe[0];
		// TODO: should I instead of having iframe.$window, have a get$Window type of dealio?
		// where all is $window needed?
		// I know it's used from within the iframe contents as frameElement.$window
		iframe.$window = $win;

		$iframe.on("load", function () {
			$win.show();
			$win.focus();
		});

		$win.$content.css({
			display: "flex",
			flexDirection: "column",
		});

		// TODO: cascade windows
		$win.center();
		$win.hide();

		return $win;
	}

	// Fix dragging things (i.e. windows) over iframes (i.e. other windows)
	// (when combined with a bit of css, .drag iframe { pointer-events: none; })
	// (and a similar thing in make_iframe_window)
	$(window).on("pointerdown", function (e) {
		//console.log(e.type);
		$("body").addClass("drag");
	});
	$(window).on("pointerup dragend blur", function (e) {
		//console.log(e.type);
		if (e.type === "blur") {
			if (document.activeElement.tagName.match(/iframe/i)) {
				return;
			}
		}
		$("body").removeClass("drag");
		$("iframe").css("pointer-events", "");
	});

	return {
		enhance_iframe,
		proxy_keyboard_events,
		make_iframe_window
	}

});
define('skylark-98js/Task',[
	"skylark-jquery",
	"./win98"
],function($,win98js){
	function Task(win) {
		Task.all_tasks.push(this);

		this.$window = win;
		
		const $task = this.$task = $("<button class='task toggle'/>").appendTo($(".tasks"));
		const $title = $("<span class='title'/>");

		this.updateTitle = () => {
			$title.text(win.getTitle());
		};

		let $icon;
		this.updateIcon = () => {
			const old_$icon = $icon;
			$icon = win.getIconAtSize(16);
			if (!$icon) {
				// $icon = $("<img src='images/icons/task-16x16.png'/>");
				old_$icon && old_$icon.remove();
				return;
			}
			if (old_$icon) {
				old_$icon.replaceWith($icon);
			} else {
				$task.prepend($icon);
			}
		};

		this.updateTitle();
		this.updateIcon();

		win.on("title-change", this.updateTitle);
		win.on("icon-change", this.updateIcon);

		win.setMinimizeTarget($task[0]);

		$task.append($icon, $title);
		$task.on("pointerdown", function (e) {
			e.preventDefault(); // prevent focus, so that the window keeps focus and we can know for minimization if it it should be focused or minimized
			// @TODO: do it on whole taskbar
		});
		$task.on("click", function () {
			if ($task.hasClass("selected")) {
				win.minimize();
				win.blur();
			} else {
				win.unminimize();
				win.bringToFront();
				win.focus();
			}
		});

		win.onFocus(() => {
			$task.addClass("selected");
		});
		win.onBlur(() => {
			$task.removeClass("selected");
		});
		win.onClosed(() => {
			$task.remove();
			const index = Task.all_tasks.indexOf(this);
			if (index !== -1) {
				Task.all_tasks.splice(index, 1);
			}
		});

		if (win.is && win.is(":visible")) {
			win.focus();
		}
	}

	Task.all_tasks = [];

	return Task;

});
define('skylark-98js/visualizer-overlay',[
	"skylark-jquery",
	"./win98"
],function($,win98js){
	function getOffset(element, fromElement) {
		let el = element,
			offsetLeft = 0,
			offsetTop = 0;

		do {
			offsetLeft += el.offsetLeft;
			offsetTop += el.offsetTop;

			el = el.offsetParent;
		} while (el && el !== fromElement);

		return { offsetLeft, offsetTop };
	}

	window.monkey_patch_render = (obj) => obj.render();

	class VisualizerOverlay {
		constructor(visualizerCanvas, renderOptions) {
			this.visualizerCanvas = visualizerCanvas;

			this.wrappyCanvas = document.createElement("canvas");
			this.wrappyCtx = this.wrappyCanvas.getContext("2d");

			this.overlayCanvases = [];
			this.animateFns = [];

			window.monkey_patch_render = (obj) => {
				// check for Butterchurn's Visualizer class
				if (obj.audio && obj.renderer) {
					obj.render();
					this.render(renderOptions);
					return;
				}
				return obj.render();
			};
		}

		makeOverlayCanvas(windowEl) {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			canvas.style.position = "absolute";
			canvas.style.left = "0";
			canvas.style.top = "0";
			canvas.style.pointerEvents = "none";
			canvas.style.mixBlendMode = "color-dodge";
			canvas.style.willChange = "opacity"; // hint fixes flickering in chrome
			canvas.className = "visualizer-overlay-canvas";
			windowEl.appendChild(canvas);
			this.overlayCanvases.push(canvas);
			this.animateFns.push(options => {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				const scale =
					(windowEl.classList.contains("doubled") ? 2 : 1) *
					(window.devicePixelRatio || 1);
				if (
					canvas.width !== windowEl.clientWidth * scale ||
					canvas.height !== windowEl.clientHeight * scale
				) {
					canvas.width = windowEl.clientWidth * scale;
					canvas.height = windowEl.clientHeight * scale;
				}
				canvas.style.width = windowEl.clientWidth + "px";
				canvas.style.height = windowEl.clientHeight + "px";
				const stuff = windowEl.querySelectorAll("*");
				Array.from(stuff)
					.map(el => {
						const width = el.clientWidth;
						const height = el.clientHeight;
						const area = width * height;
						return { element: el, width, height, area };
					})
					.filter(({ area }) => area > 0)
					.sort((a, b) => b.area - a.area)
					.forEach(({ element, width, height, area }) => {
						const { offsetLeft, offsetTop } = getOffset(element, windowEl);
						ctx.save();
						ctx.scale(scale, scale);
						ctx.translate(offsetLeft, offsetTop);
						if (options.stretch) {
							ctx.drawImage(this.wrappyCanvas, 0, 0, width, height);
						} else {
							ctx.drawImage(
								this.wrappyCanvas,
								0,
								0,
								width,
								height,
								0,
								0,
								width,
								height
							);
						}
						if (area < 30 * 30) {
							ctx.globalCompositeOperation = "destination-out";
							ctx.globalAlpha = 0.5;
							ctx.fillStyle = "black";
							ctx.fillRect(0, 0, width, height);
						}
						ctx.restore();
					});
			});
		}

		render(options) {
			const { visualizerCanvas, wrappyCanvas, wrappyCtx, animateFns } = this;
			const { width, height } = visualizerCanvas;
			if (options.mirror) {
				const drawImage = () => {
					wrappyCtx.drawImage(
						visualizerCanvas,
						0,
						0,
						width,
						height,
						0,
						0,
						width,
						height
					);
					// zoom in the source area:
					// wrappyCtx.drawImage(visualizerCanvas, width/4, height/4, width/2, height/2, 0, 0, width, height);
					// wrappyCtx.drawImage(visualizerCanvas, width/4, height/4, width/4, height/4, 0, 0, width, height);
					// for testing:
					// wrappyCtx.fillStyle = "aqua";
					// wrappyCtx.fillRect(0, 0, width, height);
				};
				wrappyCanvas.width = width * 2;
				wrappyCanvas.height = height * 2;
				wrappyCtx.save();
				drawImage();
				wrappyCtx.translate(0, height);
				wrappyCtx.scale(1, -1);
				wrappyCtx.translate(0, -height);
				drawImage();
				wrappyCtx.translate(width, 0);
				wrappyCtx.scale(-1, 1);
				wrappyCtx.translate(-width, 0);
				drawImage();
				wrappyCtx.translate(0, height);
				wrappyCtx.scale(1, -1);
				wrappyCtx.translate(0, -height);
				drawImage();
				wrappyCtx.restore();
			} else if (options.tile) {
				wrappyCanvas.width = width * 2;
				wrappyCanvas.height = height * 2;
				for (let xi = 0; xi < 2; xi++) {
					for (let yi = 0; yi < 2; yi++) {
						wrappyCtx.drawImage(
							visualizerCanvas,
							0,
							0,
							width,
							height,
							width * xi,
							height * yi,
							width,
							height
						);
					}
				}
			} else {
				wrappyCanvas.width = width;
				wrappyCanvas.height = height;
				wrappyCtx.drawImage(visualizerCanvas, 0, 0, width, height);
			}

			animateFns.forEach(fn => fn(options));
		}
		cleanUp() {
			this.overlayCanvases.forEach(canvas => {
				canvas.remove();
			});
			window.monkey_patch_render = (obj) => obj.render();
		}
		fadeOutAndCleanUp() {
			this.fadeOut();
			this.overlayCanvases[0].addEventListener("transitionend", () => {
				this.cleanUp();
			});
		}
		fadeOut() {
			this.overlayCanvases.forEach(canvas => {
				canvas.style.transition =
					"opacity 1s cubic-bezier(0.125, 0.960, 0.475, 0.915)";
				canvas.style.opacity = "0";
			});
		}
		fadeIn() {
			this.overlayCanvases.forEach(canvas => {
				canvas.style.transition = "opacity 0.2s ease";
				canvas.style.opacity = "1";
			});
		}
	}


	return VisualizerOverlay;
});
define('skylark-98js/programs',[
	"skylark-jquery",
	"skylark-browserfs",
	"./win98",
	"./filesystem-setup",
	"./helpers",
	"./FolderViewItem",
	"./iframe-windows",
	"./Task",
	"./visualizer-overlay",
	"./os-gui/$Window"
],function($,BrowserFS, win98js,FilesystemSetup,helpers,FolderViewItem,iframeWindows,Task,VisualizerOverlay, $Window){
	let make_iframe_window = iframeWindows.make_iframe_window;

	function show_help(options) {
		const $help_window = $Window({
			title: options.title || "Help Topics",
			icons: iconsAtTwoSizes("chm"),
			resizable: true,
		})
		$help_window.addClass("help-window");

		let ignore_one_load = true;
		let back_length = 0;
		let forward_length = 0;

		const $main = $(E("div")).addClass("main");
		const $toolbar = $(E("div")).addClass("toolbar");
		const add_toolbar_button = (name, sprite_n, action_fn, enabled_fn) => {
			const $button = $("<button class='lightweight'>")
				.append($("<span>").text(name))
				.appendTo($toolbar)
				.on("click", () => {
					action_fn();
				});
			$("<div class='icon'/>")
				.appendTo($button)
				.css({
					backgroundPosition: `${-sprite_n * 55}px 0px`,
				});
			const update_enabled = () => {
				$button[0].disabled = enabled_fn && !enabled_fn();
			};
			update_enabled();
			$help_window.on("click", "*", update_enabled);
			$help_window.on("update-buttons", update_enabled);
			return $button;
		};
		const measure_sidebar_width = () =>
			$contents.outerWidth() +
			parseFloat(getComputedStyle($contents[0]).getPropertyValue("margin-left")) +
			parseFloat(getComputedStyle($contents[0]).getPropertyValue("margin-right")) +
			$resizer.outerWidth();
		const $hide_button = add_toolbar_button("Hide", 0, () => {
			const toggling_width = measure_sidebar_width();
			$contents.hide();
			$resizer.hide();
			$hide_button.hide();
			$show_button.show();
			$help_window.width($help_window.width() - toggling_width);
			$help_window.css("left", $help_window.offset().left + toggling_width);
		});
		const $show_button = add_toolbar_button("Show", 5, () => {
			$contents.show();
			$resizer.show();
			$show_button.hide();
			$hide_button.show();
			const toggling_width = measure_sidebar_width();
			$help_window.width($help_window.width() + toggling_width);
			$help_window.css("left", $help_window.offset().left - toggling_width);
			// $help_window.applyBounds() would push the window to fit (before trimming it only if needed)
			// Trim the window to fit (especially for if maximized)
			if ($help_window.offset().left < 0) {
				$help_window.width($help_window.width() + $help_window.offset().left);
				$help_window.css("left", 0);
			}
		}).hide();
		add_toolbar_button("Back", 1, () => {
			$iframe[0].contentWindow.history.back();
			ignore_one_load = true;
			back_length -= 1;
			forward_length += 1;
		}, () => back_length > 0);
		add_toolbar_button("Forward", 2, () => {
			$iframe[0].contentWindow.history.forward();
			ignore_one_load = true;
			forward_length -= 1;
			back_length += 1;
		}, () => forward_length > 0);
		add_toolbar_button("Options", 3, () => { }, () => false); // TODO: hotkey and underline on O
		add_toolbar_button("Web Help", 4, () => {
			iframe.src = "help/online_support.htm";
		});

		const $iframe = $("<iframe sandbox='allow-same-origin allow-scripts allow-forms allow-modals allow-popups allow-downloads'>")
			.attr({ src: "help/default.html" })
			.addClass("inset-deep");
		const iframe = $iframe[0];
		enhance_iframe(iframe);
		iframe.$window = $help_window; // for focus handling integration
		const $resizer = $(E("div")).addClass("resizer");
		const $contents = $(E("ul")).addClass("contents inset-deep");

		// TODO: fix race conditions
		$iframe.on("load", () => {
			if (!ignore_one_load) {
				back_length += 1;
				forward_length = 0;
			}
			iframe.contentWindow.location.href
			ignore_one_load = false;
			$help_window.triggerHandler("update-buttons");
		});

		$main.append($contents, $resizer, $iframe);
		$help_window.$content.append($toolbar, $main);

		$help_window.css({ width: 800, height: 600 });

		$iframe.attr({ name: "help-frame" });
		$iframe.css({
			backgroundColor: "white",
			border: "",
			margin: "1px",
		});
		$contents.css({
			margin: "1px",
		});
		$help_window.center();

		$main.css({
			position: "relative", // for resizer
		});

		const resizer_width = 4;
		$resizer.css({
			cursor: "ew-resize",
			width: resizer_width,
			boxSizing: "border-box",
			background: "var(--ButtonFace)",
			borderLeft: "1px solid var(--ButtonShadow)",
			boxShadow: "inset 1px 0 0 var(--ButtonHilight)",
			top: 0,
			bottom: 0,
			zIndex: 1,
		});
		$resizer.on("pointerdown", (e) => {
			let pointermove, pointerup;
			const getPos = (e) =>
				Math.min($help_window.width() - 100, Math.max(20,
					e.clientX - $help_window.$content.offset().left
				));
			$G.on("pointermove", pointermove = (e) => {
				$resizer.css({
					position: "absolute",
					left: getPos(e)
				});
				$contents.css({
					marginRight: resizer_width,
				});
			});
			$G.on("pointerup", pointerup = (e) => {
				$G.off("pointermove", pointermove);
				$G.off("pointerup", pointerup);
				$resizer.css({
					position: "",
					left: ""
				});
				$contents.css({
					flexBasis: getPos(e) - resizer_width,
					marginRight: "",
				});
			});
		});

		const parse_object_params = $object => {
			// parse an $(<object>) to a plain object of key value pairs
			const object = {};
			for (const param of $object.children("param").get()) {
				object[param.name] = param.value;
			}
			return object;
		};

		let $last_expanded;

		const make_$item = text => {
			const $item = $(E("div")).addClass("item").text(text);
			$item.on("mousedown", () => {
				$contents.find(".item").removeClass("selected");
				$item.addClass("selected");
			});
			$item.on("click", () => {
				const $li = $item.parent();
				if ($li.is(".folder")) {
					if ($last_expanded) {
						$last_expanded.not($li).removeClass("expanded");
					}
					$li.toggleClass("expanded");
					$last_expanded = $li;
				}
			});
			return $item;
		};

		const $default_item_li = $(E("li")).addClass("page");
		$default_item_li.append(make_$item("Welcome to Help").on("click", () => {
			$iframe.attr({ src: "help/default.html" });
		}));
		$contents.append($default_item_li);

		function renderItemFromContents(source_li, $folder_items_ul) {
			const object = parse_object_params($(source_li).children("object"));
			if ($(source_li).find("li").length > 0) {

				const $folder_li = $(E("li")).addClass("folder");
				$folder_li.append(make_$item(object.Name));
				$contents.append($folder_li);

				const $folder_items_ul = $(E("ul"));
				$folder_li.append($folder_items_ul);

				$(source_li).children("ul").children().get().forEach((li) => {
					renderItemFromContents(li, $folder_items_ul);
				});
			} else {
				const $item_li = $(E("li")).addClass("page");
				$item_li.append(make_$item(object.Name).on("click", () => {
					$iframe.attr({ src: `${options.root}/${object.Local}` });
				}));
				if ($folder_items_ul) {
					$folder_items_ul.append($item_li);
				} else {
					$contents.append($item_li);
				}
			}
		}

		$.get(options.contentsFile, hhc => {
			$($.parseHTML(hhc)).filter("ul").children().get().forEach((li) => {
				renderItemFromContents(li, null);
			});
		});

		// @TODO: keyboard accessability
		// $help_window.on("keydown", (e)=> {
		// 	switch(e.keyCode){
		// 		case 37:
		// 			show_error_message("MOVE IT");
		// 			break;
		// 	}
		// });
		var task = new Task($help_window);
		task.$help_window = $help_window;
		return task;
	}

	function Notepad(file_path) {
		// TODO: DRY the default file names and title code (use document.title of the page in the iframe, in make_iframe_window)
		var document_title = file_path ? file_name_from_path(file_path) : "Untitled";
		var win_title = document_title + " - Notepad";
		// TODO: focus existing window if file is currently open?

		var $win = make_iframe_window({
			src: "programs/notepad/index.html" + (file_path ? ("?path=" + file_path) : ""),
			icons: iconsAtTwoSizes("notepad"),
			title: win_title,
			outerWidth: 480,
			outerHeight: 321,
			resizable: true,
		});
		return new Task($win);
	}
	Notepad.acceptsFilePaths = true;

	function Paint(file_path) {
		var $win = make_iframe_window({
			src: "programs/jspaint/index.html",
			icons: iconsAtTwoSizes("paint"),
			// NOTE: in Windows 98, "untitled" is lowercase, but TODO: we should just make it consistent
			title: "untitled - Paint",
			outerWidth: 275,
			outerHeight: 400,
			minOuterWidth: 275,
			minOuterHeight: 400,
		});

		var contentWindow = $win.$iframe[0].contentWindow;

		var waitUntil = function (test, interval, callback) {
			if (test()) {
				callback();
			} else {
				setTimeout(waitUntil, interval, test, interval, callback);
			}
		};

		const systemHooks = {
			readBlobFromHandle: (file_path) => {
				return new Promise((resolve, reject) => {
					FilesystemSetup.withFilesystem(() => {
						var fs = BrowserFS.BFSRequire("fs");
						fs.readFile(file_path, (err, buffer) => {
							if (err) {
								return reject(err);
							}
							const byte_array = new Uint8Array(buffer);
							const blob = new Blob([byte_array]);
							const file_name = file_path.replace(/.*\//g, "");
							const file = new File([blob], file_name);
							resolve(file);
						});
					});
				});
			},
			writeBlobToHandle: async (file_path, blob) => {
				const arrayBuffer = await blob.arrayBuffer();
				return new Promise((resolve, reject) => {
					FilesystemSetup.withFilesystem(()=> {
						const fs = BrowserFS.BFSRequire("fs");
						const { Buffer } = BrowserFS.BFSRequire("buffer");
						const buffer = Buffer.from(arrayBuffer);
						fs.writeFile(file_path, buffer, (err)=> {
							if (err) {
								return reject(err);
							}
							resolve();
						});
					});
				});
			},
			setWallpaperCentered: (canvas) => {
				canvas.toBlob((blob) => {
					setDesktopWallpaper(blob, "no-repeat", true);
				});
			},
			setWallpaperTiled: (canvas) => {
				canvas.toBlob((blob) => {
					setDesktopWallpaper(blob, "repeat", true);
				});
			},
		};

		// it seems like I should be able to use onload here, but when it works (overrides the function),
		// it for some reason *breaks the scrollbar styling* in jspaint
		// I don't know what's going on there

		// contentWindow.addEventListener("load", function(){
		// $(contentWindow).on("load", function(){
		// $win.$iframe.load(function(){
		// $win.$iframe[0].addEventListener("load", function(){
		waitUntil(()=> contentWindow.systemHooks, 500, ()=> {
			Object.assign(contentWindow.systemHooks, systemHooks);

			let $help_window;
			contentWindow.show_help = () => {
				if ($help_window) {
					$help_window.focus();
					return;
				}
				$help_window = show_help({
					title: "Paint Help",
					contentsFile: "programs/jspaint/help/mspaint.hhc",
					root: "programs/jspaint/help",
				}).$help_window;
				$help_window.on("close", () => {
					$help_window = null;
				});
			};

			if (file_path) {
				// window.initial_system_file_handle = ...; is too late to set this here
				// contentWindow.open_from_file_handle(...); doesn't exist
				systemHooks.readBlobFromHandle(file_path).then(file => {
					if (file) {
						contentWindow.open_from_file(file, file_path);
					}
				}, (error) => {
					// this handler may not always called for errors, sometimes error message is shown via readBlobFromHandle
					contentWindow.show_error_message(`Failed to open file ${file_path}`, error);
				});
			}

			var old_update_title = contentWindow.update_title;
			contentWindow.update_title = () => {
				old_update_title();
				$win.title(contentWindow.document.title);
			};
		});

		return new Task($win);
	}
	Paint.acceptsFilePaths = true;

	function Minesweeper() {
		var $win = make_iframe_window({
			src: "programs/minesweeper/index.html",
			icons: iconsAtTwoSizes("minesweeper"),
			title: "Minesweeper",
			innerWidth: 280,
			innerHeight: 320 + 21,
			resizable: false,
		});
		return new Task($win);
	}

	function SoundRecorder(file_path) {
		// TODO: DRY the default file names and title code (use document.title of the page in the iframe, in make_iframe_window)
		var document_title = file_path ? file_name_from_path(file_path) : "Sound";
		var win_title = document_title + " - Sound Recorder";
		// TODO: focus existing window if file is currently open?
		var $win = make_iframe_window({
			src: "programs/sound-recorder/index.html" + (file_path ? ("?path=" + file_path) : ""),
			icons: iconsAtTwoSizes("speaker"),
			title: win_title,
			innerWidth: 270,
			innerHeight: 108 + 21,
			minInnerWidth: 270,
			minInnerHeight: 108 + 21,
		});
		return new Task($win);
	}
	SoundRecorder.acceptsFilePaths = true;

	function Solitaire() {
		var $win = make_iframe_window({
			src: "programs/js-solitaire/index.html",
			icons: iconsAtTwoSizes("solitaire"),
			title: "Solitaire",
			innerWidth: 585,
			innerHeight: 384 + 21,
		});
		return new Task($win);
	}

	function showScreensaver(iframeSrc) {
		const mouseDistanceToExit = 15;
		const $iframe = $("<iframe>").attr("src", iframeSrc);
		const $backing = $("<div>");
		$backing.css({
			position: "fixed",
			left: 0,
			top: 0,
			width: "100%",
			height: "100%",
			zIndex: $Window.Z_INDEX + 9998,
			cursor: "none",
			backgroundColor: "black",
		});
		$iframe.css({
			position: "fixed",
			left: 0,
			top: 0,
			width: "100%",
			height: "100%",
			zIndex: $Window.Z_INDEX + 9999,
			border: 0,
			pointerEvents: "none",
		});
		$backing.appendTo("body");
		$iframe.appendTo("body");
		const cleanUp = () => {
			$backing.remove();
			$iframe.remove();
			const prevent = (event) => {
				event.preventDefault();
			};
			$(window).on("contextmenu", prevent);
			setTimeout(() => {
				$(window).off("contextmenu", prevent);
				window.removeEventListener("keydown", keydownHandler, true);
			}, 500);
		};
		const keydownHandler = (event) => {
			// Trying to let you change the display or capture the output
			// not allowing Ctrl+PrintScreen etc. because no modifiers
			if (!(["F11", "F12", "ZoomToggle", "PrintScreen", "MediaRecord", "BrightnessDown", "BrightnessUp", "Dimmer"].includes(event.key))) {
				event.preventDefault();
				event.stopPropagation();
				cleanUp();
			}
		};
		let startMouseX, startMouseY;
		$backing.on("mousemove pointermove", (event) => {
			if (startMouseX === undefined) {
				startMouseX = event.pageX;
				startMouseY = event.pageY;
			}
			if (Math.hypot(startMouseX - event.pageX, startMouseY - event.pageY) > mouseDistanceToExit) {
				cleanUp();
			}
		});
		$backing.on("mousedown pointerdown touchstart", (event) => {
			event.preventDefault();
			cleanUp();
		});
		// useCapture needed for scenario where you hit Enter, with a desktop icon selected
		// (If it relaunches the screensaver, it's like you can't exit it!)
		window.addEventListener("keydown", keydownHandler, true);
	}

	function Pipes() {
		const options = { hideUI: true };
		showScreensaver(`programs/pipes/index.html#${encodeURIComponent(JSON.stringify(options))}`);
	}

	function FlowerBox() {
		showScreensaver("programs/3D-FlowerBox/index.html");
	}

	function CommandPrompt() {
		var $win = make_iframe_window({
			src: "programs/command/index.html",
			icons: iconsAtTwoSizes("msdos"),
			title: "MS-DOS Prompt",
			// TODO: default dimensions
			innerWidth: 640,
			innerHeight: 400,
			constrainRect(rect, x_axis, y_axis) {
				const char_width = 8;
				const char_height = 16;
				const border = ($win.outerWidth() - $win.$content.outerWidth()) / 2;
				const inner_rect = {
					x: rect.x + border,
					y: rect.y + border + $win.$titlebar.outerHeight(),
					width: rect.width - $win.outerWidth() + $win.$content.outerWidth(),
					height: rect.height - $win.outerHeight() + $win.$content.outerHeight(),
				};
				const new_inner_rect = {
					width: Math.floor(inner_rect.width / char_width) * char_width,
					height: Math.floor(inner_rect.height / char_height) * char_height,
				};
				const new_rect = {
					x: inner_rect.x - border,
					y: inner_rect.y - border - $win.$titlebar.outerHeight(),
					width: new_inner_rect.width + $win.outerWidth() - $win.$content.outerWidth(),
					height: new_inner_rect.height + $win.outerHeight() - $win.$content.outerHeight(),
				};
				if (x_axis === -1) {
					new_rect.x = rect.x + rect.width - new_rect.width;
				}
				if (y_axis === -1) {
					new_rect.y = rect.y + rect.height - new_rect.height;
				}
				return new_rect;
			},
			// TODO: make the API simpler / more flexible like:
			// constrainDimensions({ innerWidth, innerHeight }) {
			// 	const charWidth = 8;
			// 	const charHeight = 16;
			// 	innerWidth = Math.floor(innerWidth / charWidth) * charWidth;
			// 	innerHeight = Math.floor(innerHeight / charHeight) * charHeight;
			// 	return { innerWidth, innerHeight };
			// },
		});
		return new Task($win);
	}

	function Calculator() {
		var $win = make_iframe_window({
			src: "programs/calculator/index.html",
			icons: iconsAtTwoSizes("calculator"),
			title: "Calculator",
			innerWidth: 256,
			innerHeight: 208 + 21,
			minInnerWidth: 256,
			minInnerHeight: 208 + 21,
		});
		return new Task($win);
	}

	function Pinball() {
		var $win = make_iframe_window({
			src: "programs/pinball/space-cadet.html",
			icons: iconsAtTwoSizes("pinball"),
			title: "3D Pinball for Windows - Space Cadet",
			innerWidth: 600,
			innerHeight: 416 + 20, // @TODO: where's this 20 coming from?
			minInnerWidth: 600,
			minInnerHeight: 416 + 20,
			// resizable: false, // @TODO (maybe) once gray maximized button is implemented
			override_alert: false, // to handle the alert as a fatal error, and to compensate for overzealous preventDefault()
		});
		const $splash = $("<div>").css({
			position: "fixed",
			top: 0,
			left: 0,
			width: "100%",
			height: "100%",
			background: "url(images/pinball-splash.png) no-repeat center center",
			backgroundColor: "black",
			zIndex: $Window.Z_INDEX + 6000,
		}).appendTo("body");
		setTimeout(() => {
			$splash.remove(); // just in case
		}, 5000);
		$win.$content.find("iframe").on("game-loaded", () => { // custom event dispatched from within the iframe
			$splash.remove();
		});
		$win.$content.find("iframe").on("game-load-failed", () => { // custom event dispatched from within the iframe
			$splash.remove();
			// on some systems, if the game fails to load,
			// it may result in the canvas showing through to the desktop behind the browser window
			// let's call it a feature, tie it in thematically,
			// and pretend like we did it on purpose, to baffle and amuse.
			// This happens for me on Chrome on Ubuntu with Xfce, when coming out of suspend.
			// It says "Could not create renderer / Couldn't find matching render driver"
			// It keeps happening with live reload, but stops on a regular reload, or duplicating the tab.
			$win.title("Wormhole Window - Space Cadet");
		});
		return new Task($win);
	}

	function Explorer(address) {
		// TODO: DRY the default file names and title code (use document.title of the page in the iframe, in make_iframe_window)
		var document_title = address;
		var win_title = document_title;
		// TODO: focus existing window if folder is currently open
		var $win = make_iframe_window({
			src: "programs/explorer/index.html" + (address ? ("?address=" + encodeURIComponent(address)) : ""),
			icons: iconsAtTwoSizes("folder-open"),
			title: win_title,
			// this is based on one measurement, but it uses different sizes depending on the screen resolution,
			// and may be different for different Explorer window types (Microsoft Internet Explorer, "Exploring", normal Windows Explorer*),
			// and may store the window positions, even for different types or folders, so I might have a non-standard default size measurement.
			// *See different types (resized for posing this screenshot): https://imgur.com/nxAcT9C
			innerWidth: Math.min(856, innerWidth * 0.9),
			innerHeight: Math.min(547, innerHeight * 0.7),
		});
		return new Task($win);
	}
	Explorer.acceptsFilePaths = true;

	var webamp_bundle_loaded = false;
	var load_winamp_bundle_if_not_loaded = function (includeButterchurn, callback) {
		// FIXME: webamp_bundle_loaded not actually set to true when loaded
		// TODO: also maybe handle already-loading-but-not-done
		if (webamp_bundle_loaded) {
			callback();
		} else {
			// TODO: parallelize (if possible)
			$.getScript("programs/winamp/lib/webamp.bundle.min.js", () => {
				if (includeButterchurn) {
					$.getScript("programs/winamp/lib/butterchurn.min.js", () => {
						$.getScript("programs/winamp/lib/butterchurnPresets.min.js", () => {
							callback();
						});
					});
				} else {
					callback();
				}
			});
		}
	}

	// from https://github.com/jberg/butterchurn/blob/master/src/isSupported.js
	const isButterchurnSupported = () => {
		const canvas = document.createElement('canvas');
		let gl;
		try {
			gl = canvas.getContext('webgl2');
		} catch (x) {
			gl = null;
		}

		const webGL2Supported = !!gl;
		const audioApiSupported = !!(window.AudioContext || window.webkitAudioContext);

		return webGL2Supported && audioApiSupported;
	};

	let webamp;
	let $webamp;
	let winamp_task;
	let winamp_interface;
	let winamp_loading = false;
	// TODO: support opening multiple files at once
	function openWinamp(file_path) {
		const filePathToBlob = (file_path) => {
			return new Promise((resolve, reject) => {
				FilesystemSetup.withFilesystem(function () {
					var fs = BrowserFS.BFSRequire("fs");
					fs.readFile(file_path, function (err, buffer) {
						if (err) {
							return reject(err);
						}
						const byte_array = new Uint8Array(buffer);
						const blob = new Blob([byte_array]);
						resolve(blob);
					});
				});
			});
		};

		const filePathToTrack = async (file_path) => {
			const blob = await filePathToBlob(file_path);
			const blob_url = URL.createObjectURL(blob);
			// TODO: revokeObjectURL
			const track = {
				url: blob_url,
				defaultName: file_name_from_path(file_path).replace(/\.[a-z0-9]+$/i, ""),
			};
			return track;
		};

		const whenLoaded = async () => {
			if ($webamp.css("display") === "none") {
				winamp_interface.unminimize();
			}

			winamp_interface.focus();

			if (file_path) {
				if (file_path.match(/(\.wsz|\.zip)$/i)) {
					const blob = await filePathToBlob(file_path);
					const url = URL.createObjectURL(blob);
					webamp.setSkinFromUrl(url);
				} else if (file_path.match(/(\.m3u|\.pls)$/i)) {
					alert("Sorry, we don't support playlists yet.");
				} else {
					const track = await filePathToTrack(file_path);
					webamp.setTracksToPlay([track]);
				}
			}

			winamp_loading = false;
		}
		if (winamp_task) {
			whenLoaded()
			return;
		}
		if (winamp_loading) {
			return; // TODO: queue up files?
		}
		winamp_loading = true;

		// This check creates a WebGL context, so don't do it if you try to open Winamp while it's opening or open.
		// (Otherwise it will lead to "WARNING: Too many active WebGL contexts. Oldest context will be lost.")
		const includeButterchurn = isButterchurnSupported();

		load_winamp_bundle_if_not_loaded(includeButterchurn, function () {
			const webamp_options = {
				initialTracks: [{
					metaData: {
						artist: "DJ Mike Llama",
						title: "Llama Whippin' Intro",
					},
					url: "programs/winamp/mp3/llama-2.91.mp3",
					duration: 5.322286,
				}],
				// initialSkin: {
				// 	url: "programs/winamp/skins/base-2.91.wsz",
				// },
				enableHotkeys: true,
				handleTrackDropEvent: (event) =>
					Promise.all(
						dragging_file_paths.map(filePathToTrack)
					),
				// TODO: filePickers
			};
			if (includeButterchurn) {
				webamp_options.__butterchurnOptions = {
					importButterchurn: () => Promise.resolve(window.butterchurn),
					getPresets: () => {
						const presets = window.butterchurnPresets.getPresets();
						return Object.keys(presets).map((name) => {
							return {
								name,
								butterchurnPresetObject: presets[name]
							};
						});
					},
					butterchurnOpen: true,
				};
				webamp_options.__initialWindowLayout = {
					main: { position: { x: 0, y: 0 } },
					equalizer: { position: { x: 0, y: 116 } },
					playlist: { position: { x: 0, y: 232 }, size: [0, 4] },
					milkdrop: { position: { x: 275, y: 0 }, size: [7, 12] }
				};
			}
			webamp = new Webamp(webamp_options);

			var visual_container = document.createElement("div");
			visual_container.classList.add("webamp-visual-container");
			visual_container.style.position = "absolute";
			visual_container.style.left = "0";
			visual_container.style.right = "0";
			visual_container.style.top = "0";
			visual_container.style.bottom = "0";
			visual_container.style.pointerEvents = "none";
			document.body.appendChild(visual_container);
			// Render after the skin has loaded.
			webamp.renderWhenReady(visual_container).then(() => {
				window.console && console.log("Webamp rendered");

				$webamp = $("#webamp");
				// Bring window to front, initially and when clicked
				$webamp.css({
					position: "absolute",
					left: 0,
					top: 0,
					zIndex: $Window.Z_INDEX++
				});

				const $eventTarget = $({});
				const makeSimpleListenable = (name) => {
					return (callback) => {
						const fn = () => {
							callback();
						};
						$eventTarget.on(name, fn);
						const dispose = () => {
							$eventTarget.off(name, fn);
						};
						return dispose;
					};
				};

				winamp_interface = {};
				winamp_interface.onFocus = makeSimpleListenable("focus");
				winamp_interface.onBlur = makeSimpleListenable("blur");
				winamp_interface.onClosed = makeSimpleListenable("closed");
				winamp_interface.getIconAtSize = (target_icon_size) => {
					if (target_icon_size !== 32 && target_icon_size !== 16) {
						target_icon_size = 32;
					}
					const img = document.createElement("img");
					img.src = helpers.getIconPath("winamp2", target_icon_size);
					return img;
				};
				winamp_interface.bringToFront = () => {
					$webamp.css({
						zIndex: $Window.Z_INDEX++
					});
				};
				winamp_interface.element = winamp_interface[0] = $webamp[0]; // for checking z-index in window switcher
				winamp_interface.hasClass = (className) => { // also for window switcher (@TODO: clean this stuff up)
					if (className === "focused") {
						return $webamp.hasClass("focused");
					}
					return false;
				};
				winamp_interface.focus = () => {
					if (!$webamp.hasClass("focused")) {
						$webamp.addClass("focused");
						winamp_interface.bringToFront();
						$eventTarget.triggerHandler("focus");
						// @TODO: focus last focused window/control?
						$webamp.find("#main-window [tabindex='-1']").focus();
					}
				};
				winamp_interface.blur = () => {
					if ($webamp.hasClass("focused")) {
						$webamp.removeClass("focused");
						$eventTarget.triggerHandler("blur");
						// TODO: really blur
					}
				};
				winamp_interface.minimize = () => {
					// TODO: are these actually useful or does webamp hide it?
					$webamp.hide();
				};
				winamp_interface.unminimize = () => {
					// more to the point does this work necessarily??
					$webamp.show();
					// $webamp.focus();
				};
				winamp_interface.close = () => {
					// not allowing canceling close event in this case (generally used *by* an application (for "Save changes?"), not outside of it)
					// TODO: probably something like winamp_task.close()
					// winamp_interface.triggerHandler("close");
					// winamp_interface.triggerHandler("closed");
					webamp.dispose();
					$webamp.remove();

					$eventTarget.triggerHandler("closed");

					webamp = null;
					$webamp = null;
					winamp_task = null;
					winamp_interface = null;
				};
				winamp_interface.getTitle = () => {
					let taskTitle = "Winamp 2.91";
					const $cell = $webamp.find(".playlist-track-titles .track-cell.current");
					if ($cell.length) {
						taskTitle = `${$cell.text()} - Winamp`;
						switch (webamp.getMediaStatus()) {
							case "STOPPED":
								taskTitle = `${taskTitle} [Stopped]`
								break;
							case "PAUSED":
								taskTitle = `${taskTitle} [Paused]`
								break;
						}
					}
					return taskTitle;
				};
				winamp_interface.setMinimizeTarget = () => {
					// dummy function; it won't animate to the minimize target anyway
					// (did Winamp on Windows 98 animate minimize/restore?)
				};
				// @TODO: this wasn't supposed to be part of the API, but it's needed for the taskbar
				winamp_interface.on = (event_name, callback) => {
					if (event_name === "title-change") {
						webamp.onTrackDidChange(callback);
					} else if (event_name === "icon-change") {
						// icon will never change
					} else {
						console.warn(`Unsupported event: ${event_name}`);
					}
				};

				helpers.mustHaveMethods(winamp_interface, helpers.windowInterfaceMethods);

				let raf_id;
				let global_pointerdown;

				winamp_task = new Task(winamp_interface);
				webamp.onClose(function () {
					winamp_interface.close();
					cancelAnimationFrame(raf_id);
					visualizerOverlay.fadeOutAndCleanUp();
				});
				webamp.onMinimize(function () {
					winamp_interface.minimize();
				});

				$webamp.on("focusin", () => {
					winamp_interface.focus();
				});
				$webamp.on("focusout", () => {
					// could use relatedTarget, no?
					if (
						!document.activeElement ||
						!document.activeElement.closest ||
						!document.activeElement.closest("#webamp")
					) {
						winamp_interface.blur();
					}
				});

				const visualizerOverlay = new VisualizerOverlay(
					$webamp.find(".gen-window canvas")[0],
					{ mirror: true, stretch: true },
				);

				// TODO: replace with setInterval
				// Note: can't access butterchurn canvas image data during a requestAnimationFrame here
				// because of double buffering
				const animate = () => {
					const windowElements = $(".os-window, .window:not(.gen-window)").toArray();
					windowElements.forEach(windowEl => {
						if (!windowEl.hasOverlayCanvas) {
							visualizerOverlay.makeOverlayCanvas(windowEl);
							windowEl.hasOverlayCanvas = true;
						}
					});

					if (webamp.getMediaStatus() === "PLAYING") {
						visualizerOverlay.fadeIn();
					} else {
						visualizerOverlay.fadeOut();
					}
					raf_id = requestAnimationFrame(animate);
				};
				raf_id = requestAnimationFrame(animate);

				whenLoaded()
			}, (error) => {
				// TODO: show_error_message("Failed to load Webamp:", error);
				alert("Failed to render Webamp:\n\n" + error);
				console.error(error);
			});
		});
	}
	openWinamp.acceptsFilePaths = true;

	/*
	function saveAsDialog(){
		var $win = new $Window();
		$win.title("Save As");
		return $win;
	}
	function openFileDialog(){
		var $win = new $Window();
		$win.title("Open");
		return $win;
	}
	*/

	function openURLFile(file_path) {
		FilesystemSetup.withFilesystem(function () {
			var fs = BrowserFS.BFSRequire("fs");
			fs.readFile(file_path, "utf8", function (err, content) {
				if (err) {
					return alert(err);
				}
				// it's supposed to be an ini-style file, but lets handle files that are literally just a URL as well, just in case
				var match = content.match(/URL\s*=\s*([^\n\r]+)/i);
				var url = match ? match[1] : content;
				Explorer(url);
			});
		});
	}
	openURLFile.acceptsFilePaths = true;

	function openThemeFile(file_path) {
		FilesystemSetup.withFilesystem(function () {
			var fs = BrowserFS.BFSRequire("fs");
			fs.readFile(file_path, "utf8", function (err, content) {
				if (err) {
					return alert(err);
				}
				loadThemeFromText(content);
				try {
					localStorage.setItem("desktop-theme", content);
					localStorage.setItem("desktop-theme-path", file_path);
				} catch (error) {
					// no local storage
				}
			});
		});
	}
	openThemeFile.acceptsFilePaths = true;

	// Note: extensions must be lowercase here. This is used to implement case-insensitive matching.
	var file_extension_associations = {
		// Fonts:
		// - eot (Embedded OpenType)
		// - otf (OpenType)
		// - ttf (TrueType)
		// - woff (Web Open Font Format)
		// - woff2 (Web Open Font Format 2)
		// - (also svg but that's mainly an image format)

		// Misc binary:
		// - wasm (WebAssembly)
		// - o (Object file)
		// - so (Shared Object)
		// - dll (Dynamic Link Library)
		// - exe (Executable file)
		// - a (static library)
		// - lib (static library)
		// - pdb (Program Debug database)
		// - idb (Intermediate Debug file)
		// - bcmap (Binary Character Map)
		// - bin (generic binary file extension)

		// Text:
		"": Notepad, // bare files such as LICENSE, Makefile, CNAME, etc.
		ahk: Notepad,
		ai: Paint,
		bat: Notepad,
		check_cache: Notepad,
		cmake: Notepad,
		cmd: Notepad,
		conf: Notepad,
		cpp: Notepad,
		css: Notepad,
		d: Notepad,
		editorconfig: Notepad,
		filters: Notepad,
		gitattributes: Notepad,
		gitignore: Notepad,
		gitrepo: Notepad,
		h: Notepad,
		hhc: Notepad,
		hhk: Notepad,
		html: Notepad,
		ini: Notepad,
		js: Notepad,
		json: Notepad,
		log: Notepad,
		make: Notepad,
		map: Notepad,
		marks: Notepad,
		md: Notepad,
		prettierignore: Notepad,
		properties: Notepad,
		rc: Notepad,
		rsp: Notepad,
		sh: Notepad,
		ts: Notepad,
		txt: Notepad,
		vcxproj: Notepad,
		webmanifest: Notepad,
		xml: Notepad,
		yml: Notepad,

		// Images:
		bmp: Paint,
		cur: Paint,
		eps: Paint,
		gif: Paint,
		icns: Paint,
		ico: Paint,
		jpeg: Paint,
		jpg: Paint,
		kra: Paint,
		pbm: Paint,
		pdf: Paint, // yes I added PDF support to JS Paint (not all formats listed here are supported though)
		pdn: Paint,
		pgm: Paint,
		png: Paint,
		pnm: Paint,
		ppm: Paint,
		ps: Paint,
		psd: Paint,
		svg: Paint,
		tga: Paint,
		tif: Paint,
		tiff: Paint,
		webp: Paint,
		xbm: Paint,
		xcf: Paint,
		xcfbz2: Paint,
		xcfgz: Paint,
		xpm: Paint,

		// Winamp Skins:
		wsz: openWinamp, // winamp skin zip
		zip: openWinamp, // MIGHT be a winamp skin zip, so might as well for now

		// Audio:
		wav: SoundRecorder,
		mp3: openWinamp,
		ogg: openWinamp,
		wma: openWinamp,
		m4a: openWinamp,
		aac: openWinamp,
		flac: openWinamp,
		mka: openWinamp,
		mpc: openWinamp,
		"mp+": openWinamp,

		// Playlists:
		m3u: openWinamp,
		pls: openWinamp,

		// Misc:
		htm: Explorer,
		html: Explorer,
		url: openURLFile,
		theme: openThemeFile,
		themepack: openThemeFile,
	};

	// Note: global systemExecuteFile called by explorer
	function systemExecuteFile(file_path) {
		// execute file with default handler
		// like the START command in CMD.EXE

		FilesystemSetup.withFilesystem(function () {
			var fs = BrowserFS.BFSRequire("fs");
			fs.stat(file_path, function (err, stats) {
				if (err) {
					return alert("Failed to get info about " + file_path + "\n\n" + err);
				}
				if (stats.isDirectory()) {
					Explorer(file_path);
				} else {
					var file_extension = file_extension_from_path(file_path);
					var program = file_extension_associations[file_extension.toLowerCase()];
					if (program) {
						if (!program.acceptsFilePaths) {
							alert(program.name + " does not support opening files via the virtual filesystem yet");
							return;
						}
						program(file_path);
					} else {
						alert("No program is associated with " + file_extension + " files");
					}
				}
			});
		});
	}



	function initDesktopFolderView(folder_view) {
		// TODO: base all the desktop icons off of the filesystem
		// Note: `C:\Windows\Desktop` doesn't contain My Computer, My Documents, Network Neighborhood, Recycle Bin, or Internet Explorer,
		// or Connect to the Internet, or Setup MSN Internet Access,
		// whereas `Desktop` does (that's the full address it shows; it's one of them "special locations")
		var add_icon_not_via_filesystem = function (options) {
			folder_view.add_item(new FolderViewItem({
				icons: {
					// @TODO: know what sizes are available
					[helpers.DESKTOP_ICON_SIZE]: helpers.getIconPath(options.iconID, helpers.DESKTOP_ICON_SIZE),
				},
				...options,
			}));
		};
		add_icon_not_via_filesystem({
			title: "My Computer",
			iconID: "my-computer",
			open: function () { systemExecuteFile("/"); },
			// file_path: "/",
			is_system_folder: true,
		});
		add_icon_not_via_filesystem({
			title: "My Documents",
			iconID: "my-documents-folder",
			open: function () { systemExecuteFile("/my-documents"); },
			// file_path: "/my-documents/",
			is_system_folder: true,
		});
		add_icon_not_via_filesystem({
			title: "Network Neighborhood",
			iconID: "network",
			open: function () { systemExecuteFile("/network-neighborhood"); },
			// file_path: "/network-neighborhood/",
			is_system_folder: true,
		});
		add_icon_not_via_filesystem({
			title: "Recycle Bin",
			iconID: "recycle-bin",
			open: function () { Explorer("https://www.epa.gov/recycle/"); },
			is_system_folder: true,
		});
		add_icon_not_via_filesystem({
			title: "My Pictures",
			iconID: "folder",
			open: function () { systemExecuteFile("/my-pictures"); },
			// file_path: "/my-pictures/",
			is_system_folder: true,
		});
		add_icon_not_via_filesystem({
			title: "Internet Explorer",
			iconID: "internet-explorer",
			open: function () { Explorer("https://www.google.com/"); }
		});
		add_icon_not_via_filesystem({
			title: "Paint",
			iconID: "paint",
			open: Paint,
			shortcut: true
		});
		add_icon_not_via_filesystem({
			title: "Minesweeper",
			iconID: "minesweeper",
			open: Minesweeper,
			shortcut: true
		});
		add_icon_not_via_filesystem({
			title: "Sound Recorder",
			iconID: "speaker",
			open: SoundRecorder,
			shortcut: true
		});
		add_icon_not_via_filesystem({
			title: "Solitaire",
			iconID: "solitaire",
			open: Solitaire,
			shortcut: true
		});
		add_icon_not_via_filesystem({
			title: "Notepad",
			iconID: "notepad",
			open: Notepad,
			shortcut: true
		});
		add_icon_not_via_filesystem({
			title: "Winamp",
			iconID: "winamp2",
			open: openWinamp,
			shortcut: true
		});
		add_icon_not_via_filesystem({
			title: "3D Pipes",
			iconID: "pipes",
			open: Pipes,
			shortcut: true
		});
		add_icon_not_via_filesystem({
			title: "3D Flower Box",
			iconID: "pipes",
			open: FlowerBox,
			shortcut: true
		});
		add_icon_not_via_filesystem({
			title: "MS-DOS Prompt",
			iconID: "msdos",
			open: CommandPrompt,
			shortcut: true
		});
		add_icon_not_via_filesystem({
			title: "Calculator",
			iconID: "calculator",
			open: Calculator,
			shortcut: true
		});
		add_icon_not_via_filesystem({
			title: "Pinball",
			iconID: "pinball",
			open: Pinball,
			shortcut: true
		});

		folder_view.arrange_icons();

	}


	function iconsAtTwoSizes(iconID) {
		return {
			16: `images/icons/${iconID}-16x16.png`,
			32: `images/icons/${iconID}-32x32.png`,
		};
	}

	return {
		systemExecuteFile,
		initDesktopFolderView
	};

});
define('skylark-98js/$desktop',[
	"skylark-jquery",
	"./win98",
	"./FolderView",
	"./programs"
],function($,win98js,FolderView,programs){
    "use strict";

	const desktop_folder_path = "/desktop/";

	var $desktop = $(".desktop");
	$desktop.css("touch-action", "none"); // TODO: should this be in FolderView, or is it to prevent scrolling the page or what?

	var folder_view = new FolderView(desktop_folder_path, {
		asDesktop: true,
		openFileOrFolder: (path) => { // Note: may not be defined yet, so wrapping with a function.
			programs.systemExecuteFile(path);
		},
	});
	$(folder_view.element).appendTo($desktop);

	function setDesktopWallpaper(file, repeat, saveToLocalStorage) {
		const blob_url = URL.createObjectURL(file);
		$desktop.css({
			backgroundImage: `url(${blob_url})`,
			backgroundRepeat: repeat,
			backgroundPosition: "center",
			backgroundSize: "auto",
		});
		if (saveToLocalStorage) {
			var fr = new FileReader();
			window.fr = fr;
			fr.onload = () => {
				localStorage.setItem("wallpaper-data-url", fr.result);
				localStorage.setItem("wallpaper-repeat", repeat);
			};
			fr.onerror = () => {
				console.error("Error reading file (for setting wallpaper)", file);
			};
			fr.readAsDataURL(file);
		}
	}
	try {
		var wallpaper_data_url = localStorage.getItem("wallpaper-data-url");
		var wallpaper_repeat = localStorage.getItem("wallpaper-repeat");
		var theme_file_content = localStorage.getItem("desktop-theme");
		if (wallpaper_data_url) {
			fetch(wallpaper_data_url).then(r => r.blob()).then(file => {
				setDesktopWallpaper(file, wallpaper_repeat, false);
			});
		}
		if (theme_file_content) {
			loadThemeFromText(theme_file_content);
		}
	} catch (error) {
		console.error(error);
	}

	// Prevent drag and drop from redirecting the page (the browser default behavior for files)
	// TODO: only prevent if there are actually files; there's nothing that uses text inputs atm that's not in an iframe, so it doesn't matter YET (afaik)
	// $G.on("dragover", function(e){
	// 	e.preventDefault();
	// });
	// $G.on("drop", function(e){
	// 	e.preventDefault();
	// });

	function loadThemeFile(file) {
		var reader = new FileReader();
		reader.onload = () => {
			loadThemeFromText(reader.result);
		};
		reader.readAsText(file);
	}
	function applyTheme(cssProperties, documentElement = document.documentElement) {
		applyCSSProperties(cssProperties, { element: documentElement, recurseIntoIframes: true });
	}
	function loadThemeFromText(fileText) {
		var cssProperties = parseThemeFileString(fileText);
		applyTheme(cssProperties);
		window.themeCSSProperties = cssProperties;
	}

	$("html").on("dragover", function (event) {
		event.preventDefault();
		event.stopPropagation();
	});
	$("html").on("dragleave", function (event) {
		event.preventDefault();
		event.stopPropagation();
	});
	$("html").on("drop", function (event) {
		event.preventDefault();
		event.stopPropagation();
		var files = [...event.originalEvent.dataTransfer.files];
		for (var file of files) {
			if (file.name.match(/\.theme(pack)?$/i)) {
				loadThemeFile(file);
			}
		}
	});

	// Despite overflow:hidden on html and body,
	// focusing elements that are partially offscreen can still scroll the page.
	// For example, with opening Paint and moving it partially offscreen and opening Image > Attributes,
	// the default focused button can scroll the entire desktop.
	// We need to prevent (reset) scroll, and also avoid scrollIntoView().
	$(window).on("scroll focusin", () => {
		window.scrollTo(0, 0);
	});


	programs.initDesktopFolderView(folder_view);


	$desktop.reflow();

	return win98js.$desktop = $desktop;
});
define('skylark-98js/$start-menu',[
	"skylark-jquery",
	"./win98",
	"./os-gui/$Window"
],function($,win98js,$Window){
	// TODO: start menu

	/*
	// if running from file: protocol, try to sniff the username >:)
	var username_match = location.href.match(/\/(Users|home)\/(\w+)\//);
	var username = username_match && username_match[1] || "Admin";
	*/

	var $start_menu = $(".start-menu");
	$start_menu.hide();
	// TODO: legitimate contents or whatever
	var open_start_menu = function () {
		$start_button.addClass("selected");
		$start_menu.attr("hidden", null);
		$start_menu.slideDown(100); // DOWN AS IN UP (stupid jQuery)
		$start_menu.css({ zIndex: ++$Window.Z_INDEX + 5001 });
	};
	var close_start_menu = function () {
		$start_button.removeClass("selected");
		$start_menu.attr("hidden", "hidden");
		$start_menu.hide();
	};
	var toggle_start_menu = function () {
		if ($start_menu.is(":hidden")) {
			open_start_menu();
		} else {
			close_start_menu();
		}
	};

	var $start_button = $(".start-button");
	$start_button.on("pointerdown", function () {
		toggle_start_menu();
	});

	$("body").on("pointerdown", function (e) {
		if ($(e.target).closest(".start-menu, .start-button").length === 0) {
			close_start_menu();
		}
	});
	// Note: A lot of the time it's good to use focusout (in jQuery, or else blur with useCapture?[1]) as opposed to 
	// That might be the case here as well, but maybe not since programs opening might grab focus and that probably shouldn't close the start menu
	// Although at the operating system level it would probably prevent focus switching in the first place, so maybe we could do that
	// The point being this is an operating system control and so it may warrant special handling,
	// but generally I'd recommend making a control focusable and detecting loss of focus as in this answer:
	// [1]: https://stackoverflow.com/a/38317768/2624876

	$(window).on("keydown", function (e) {
		if (e.which === 27) { // Esc to close
			close_start_menu();
		}
	});

	return $start_menu;
});
define('skylark-98js/$taskbar-time',[
	"skylark-jquery",
	"./win98"
],function($,win98js){
	var $time = $(".taskbar-time");
	var update_time = function () {
		$time.text(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
		$time.attr("title", new Date().toLocaleString([], { weekday: 'long', month: 'long', day: '2-digit', minute: '2-digit', hour: '2-digit' }));
		setTimeout(update_time, 1000);
	};
	update_time();

	return $time;
});

define('skylark-98js/msgbox',[
	"skylark-jquery",
	"./win98",
	"./os-gui/$Window"
],function($,win98js,$Window){
	// Prefer a function injected from outside an iframe,
	// which will make dialogs that can go outside the iframe.
	// Note that this API must be kept in sync with the version in jspaint.

	// Note `defaultMessageBoxTitle` handling in make_iframe_window
	// Any other default parameters need to be handled there (as it works now)

	var chord_audio = new Audio("/audio/CHORD.WAV");

	window.showMessageBox = window.showMessageBox || (({
		title = window.defaultMessageBoxTitle /*??*/ ||  "Alert",
		message,
		messageHTML,
		buttons = [{ label: "OK", value: "ok", default: true }],
		iconID = "warning", // "error", "warning", "info", or "nuke" for deleting files/folders
		windowOptions = {}, // for controlling width, etc.
	}) => {
		let $window, $message;
		const promise = new Promise((resolve, reject) => {
			$window = new $Window(Object.assign({
				title,
				resizable: false,
				innerWidth: 400,
				maximizeButton: false,
				minimizeButton: false,
			}, windowOptions));
			// $window.addClass("dialog-window horizontal-buttons");
			$message =
				$("<div>").css({
					textAlign: "left",
					fontFamily: "MS Sans Serif, Arial, sans-serif",
					fontSize: "14px",
					marginTop: "22px",
					flex: 1,
					minWidth: 0, // Fixes hidden overflow, see https://css-tricks.com/flexbox-truncated-text/
					whiteSpace: "normal", // overriding .window:not(.squish)
				});
			if (messageHTML) {
				$message.html(messageHTML);
			} else if (message) { // both are optional because you may populate later with dynamic content
				$message.text(message).css({
					whiteSpace: "pre-wrap",
					wordWrap: "break-word",
				});
			}
			$("<div>").append(
				$("<img width='32' height='32'>").attr("src", `../../images/icons/${iconID}-32x32-8bpp.png`).css({
					margin: "16px",
					display: "block",
				}),
				$message
			).css({
				display: "flex",
				flexDirection: "row",
			}).appendTo($window.$content);

			$window.$content.css({
				textAlign: "center",
			});
			for (const button of buttons) {
				const $button = $window.$Button(button.label, () => {
					button.action && button.action(); // API may be required for using user gesture requiring APIs
					resolve(button.value);
					$window.close(); // actually happens automatically
				});
				if (button.default) {
					$button.addClass("default");
					$button.focus();
					setTimeout(() => $button.focus(), 0); // @TODO: why is this needed? does it have to do with the iframe window handling?
				}
				$button.css({
					minWidth: 75,
					height: 23,
					margin: "16px 2px",
				});
			}
			$window.on("focusin", "button", (event) => {
				$(event.currentTarget).addClass("default");
			});
			$window.on("focusout", "button", (event) => {
				$(event.currentTarget).removeClass("default");
			});
			$window.on("closed", () => {
				resolve("closed"); // or "cancel"? do you need to distinguish?
			});
			$window.center();
		});
		promise.$window = $window;
		promise.$message = $message;
		promise.promise = promise; // for easy destructuring
		try {
			chord_audio.play();
		} catch (error) {
			console.log(`Failed to play ${chord_audio.src}: `, error);
		}
		return promise;
	});

	window.alert = (message) => {
		showMessageBox({ message });
	};

});
define('skylark-98js/window-switcher',[
	"skylark-jquery",
	"skylark-clippy",
	"./win98",
	"./Task"
],function($,clippy,win98js,Task){
	
	var $window_switcher = $("<div class='window-switcher outset-deep'>");
	var $window_switcher_list = $("<ul class='window-switcher-list'>").appendTo($window_switcher);
	var $window_switcher_window_name = $("<div class='window-switcher-window-name inset-deep'>").appendTo($window_switcher);
	var agent;
	var used_window_switcher = false;

	function activate_window($window) {
		// console.log("Activating window:", $window);
		$window.unminimize();
		$window.bringToFront();
		$window.focus(); // unminimize will focus but only if it was minimized (that's the current behavior anyway)
	}

	function show_window_switcher(cycle_backwards) {
		if ($window_switcher.is(":visible")) {
			cycle_window_switcher(cycle_backwards);
			return;
		}
		$window_switcher_list.empty();
		const tasks = Task.all_tasks;
		if (tasks.length === 1) {
			activate_window(tasks[0].$window);
			if (!used_window_switcher) {
				agent && agent.stopCurrent(); // needed to continue on from the message with `hold` set (speak(message, true))
				agent && agent.speak("If there's only one window, Alt+` will switch to it right away.");
				// used_window_switcher = true; // allow the switching message to be spoken later
			}
			return;
		}
		if (tasks.length < 2) {
			return;
		}
		tasks.sort((a, b) =>
			// using z-index, as it's similar to last-used order
			b.$window[0].style.zIndex - a.$window[0].style.zIndex
		);
		for (const task of tasks) {
			var $window = task.$window;
			var $item = $("<li>").addClass("window-switcher-item");
			$item.append($window.getIconAtSize(32) /*??*/ ||  $("<img>").attr({
				src: "/images/icons/task-32x32.png",
				width: 32,
				height: 32,
				alt: $window.getTitle()
			}));
			$item.data("$window", $window);
			// $item.on("click", function () { // Windows 98 didn't allow clicking items in the window switcher.
			// 	activate_window($window);
			// });
			$window_switcher_list.append($item);
			if ($window.hasClass("focused")) {
				$item.addClass("active");
			}
		}
		cycle_window_switcher(cycle_backwards);
		$window_switcher.appendTo("body");
		// console.log("Showing window switcher", $window_switcher[0]);
		if (!used_window_switcher) {
			agent && agent.stopCurrent(); // needed to continue on from the message with `hold` set (speak(message, true))
			// Um, if you know about Alt+Tab, you can guess about how Alt+` works. But Clippy is supposed to be annoying, right?
			agent && agent.speak("There you go! Press grave accent until you get to the window you want.");
			used_window_switcher = true;
		}
	}
	function cycle_window_switcher(cycle_backwards) {
		const items = $window_switcher.find(".window-switcher-item").toArray();
		const $active = $window_switcher.find(".active");
		const old_index = items.indexOf($active[0]);
		const new_index = ((old_index + (cycle_backwards ? -1 : 1)) + items.length) % items.length;
		$active.removeClass("active");
		const new_item = items[new_index];
		$(new_item).addClass("active");
		$window_switcher_window_name.text($(new_item).data("$window").getTitle());
	}
	function window_switcher_close_and_select() {
		if (!$window_switcher.is(":visible")) {
			return;
		}
		const $active = $window_switcher.find(".active");
		if ($active.length === 0) {
			return;
		}
		activate_window($active.data("$window"));
		$window_switcher.remove(); // must remove only after getting data()
	}
	function window_switcher_cancel() {
		$window_switcher.remove();
	}

	window.addEventListener("keydown", handle_keydown, true);
	window.addEventListener("keyup", handle_keyup, true);
	window.addEventListener("blur", window_switcher_cancel); // this may be from an iframe getting focus (e.g. an app was loading), but in that case we might not be able to get the keyup anyways
	// @TODO: detect if it's an iframe we've integrated with and thus could get the keyup event
	// @TODO: also detect blur inside iframes, to cancel window switching

	var iid;
	var alt_held = false; // for detecting likely Alt+Tab
	var notice_shown = false;
	function handle_keydown(e) {
		if (e.altKey && (e.key === "4" || e.key === "F4")) { // we can't actually intercept Alt+F4, but might as well try, right?
			e.preventDefault();
			const $window = e.target.closest(".os-window") && e.target.closest(".os-window").$window;
			console.log("Alt+4 detected, closing window", $window, e.target);
			$window && $window.close();
		}
		// console.log(e.key, e.code);
		if (e.altKey && (e.code === "Backquote" || e.code === "Tab")) {
			show_window_switcher(e.shiftKey);
		} else {
			window_switcher_cancel();
		}
		if (e.key === "Alt") {
			alt_held = true;
			// console.log("Alt held");
			clearInterval(iid);
			iid = setInterval(look_for_focus_loss, 200);
		}
	}
	function handle_keyup(e) {
		// console.log("keyup", e.key, e.code);
		// if (e.key === "Alt") { // on my Ubuntu XFCE, it's giving "Meta" if Shift is held
		if (!e.altKey) {
			alt_held = false;
			clearInterval(iid);
			// console.log("Alt released");
			window_switcher_close_and_select();
		}
	}
	function look_for_focus_loss() {
		// Welcome to Heuristic Hurdles! I'm your host, Hacky Hairy. Today we're going to be detecting Alt+Tab.
		// Alt+Tab is a common shortcut for switching between windows, but we can't actually intercept it.
		// In fact, the browser doesn't even know about it. It's handled by the window manager directly.
		// We'll have to pick another shortcut, but who's going to know about it? Wouldn't it be nice if we could at least detect Alt+Tab,
		// to inform users of the new shortcut? How are we going to do that, in mere JavaScript?
		// Heuristics! *queue Heuristic Hurdles theme song*

		// console.log("alt_held", alt_held, "!top.document.hasFocus()", !top.document.hasFocus(), "top.document.hasFocus()", top.document.hasFocus(), "top.document", top.document, "top.activeElement", top.document.activeElement);
		if (alt_held && !top.document.hasFocus()) {
			// Some things like closing a window with Alt+4 can cause the document to lose focus, without Alt+Tab.
			// But if the window's really lost focus, we shouldn't be able to focus an element in it to focus the document.
			// So we can use that to refine the heuristic.
			if (
				!top.document.activeElement ||
				top.document.activeElement === top.document.body ||
				top.document.activeElement === top.document.documentElement
			) {
				// try focusing the document (or window, rather)
				top.focus();
				if (top.document.hasFocus()) {
					// console.log("Focused document");
					return;
				} else {
					// console.log("Couldn't focus document, so you've probably Alt+Tabbed");
				}
			} else {
				// console.log("Active element is", top.document.activeElement, " despite hasFocus() being false so you've probably Alt+Tabbed");
			}

			// False positives:
			// - Alt+D focuses the address bar in Chrome
			// - Hold Alt and click outside the browser window
			// - Alt+Space shows the system window menu on some platforms, and on Ubuntu XFCE in Firefox this causes a false positive but not in Chrome apparently (weird!)
			// - Alt+(number) focuses a tab in Chrome, but it actually lets us cancel it; @TODO: detect this as not an Alt+Tab (could use a timeout after any key pressed while holding Alt)

			clearInterval(iid);
			alt_held = false;

			if (Task.all_tasks.length < 2) {
				return;
			}
			if (!notice_shown) {
				new clippy.load("Clippy", function (loaded_agent) {
					agent = loaded_agent;
					agent.show();
					const message = "It looks like you're trying to switch windows.\n\nUse Alt+` (grave accent) instead of Alt+Tab within the 98.js desktop.\n\nAlso, use Alt+4 instead of Alt+F4 to close windows.";
					agent.speak(message, true);
					// held message causes double click to not animate Clippy, for some reason (even after message is cleared)
					$(agent._el).one("dblclick", function () {
						agent.stopCurrent();
						agent.animate();
					});
				});
				notice_shown = true;
			}
		}
	}

});

define('skylark-98js/main',[
	"./$desktop",
	"./$start-menu",
	"./$taskbar-time",
	"./filesystem-setup",
	"./FolderView",
	"./FolderViewItem",
	"./msgbox",
	"./Task",
	"./visualizer-overlay",
	"./window-switcher"
],function(){
	
});
define('skylark-98js', ['skylark-98js/main'], function (main) { return main; });


},this);
//# sourceMappingURL=sourcemaps/skylark-98js-standard.js.map
