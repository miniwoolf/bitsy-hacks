/**
🔳
@file transparent background
@summary makes the game have a transparent background
@license MIT
@version 15.3.1
@requires Bitsy Version: 7.2
@author Cephalopodunk & Sean S. LeBlanc

@description
Makes the game background transparent, showing whatever would be visible behind it in the html document.

Note: also includes transparent sprites

HOW TO USE:
1. Copy-paste this script into a script tag after the bitsy source
2. Edit hackOptions below as needed
*/
this.hacks = this.hacks || {};
(function (exports, bitsy) {
'use strict';
var hackOptions$1 = {
	// transparent sprites option
	isTransparent: function (drawing) {
		// return drawing.name == 'tea'; // specific transparent drawing
		// return ['tea', 'flower', 'hat'].indexOf(drawing.name) !== -1; // specific transparent drawing list
		// return drawing.name && drawing.name.indexOf('TRANSPARENT') !== -1; // transparent drawing flag in name
		return true; // all drawings are transparent
	},
};

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

bitsy = bitsy || /*#__PURE__*/_interopDefaultLegacy(bitsy);

/**
@file utils
@summary miscellaneous bitsy utilities
@author Sean S. LeBlanc
*/

/*
Helper used to replace code in a script tag based on a search regex
To inject code without erasing original string, using capturing groups; e.g.
	inject(/(some string)/,'injected before $1 injected after')
*/
function inject(searchRegex, replaceString) {
	// find the relevant script tag
	var scriptTags = document.getElementsByTagName('script');
	var scriptTag;
	var code;
	for (var i = 0; i < scriptTags.length; ++i) {
		scriptTag = scriptTags[i];
		var matchesSearch = scriptTag.textContent.search(searchRegex) !== -1;
		var isCurrentScript = scriptTag === document.currentScript;
		if (matchesSearch && !isCurrentScript) {
			code = scriptTag.textContent;
			break;
		}
	}

	// error-handling
	if (!code) {
		throw new Error('Couldn\'t find "' + searchRegex + '" in script tags');
	}

	// modify the content
	code = code.replace(searchRegex, replaceString);

	// replace the old script tag with a new one using our modified code
	var newScriptTag = document.createElement('script');
	newScriptTag.textContent = code;
	scriptTag.insertAdjacentElement('afterend', newScriptTag);
	scriptTag.remove();
}

/**
 * Helper for getting an array with unique elements
 * @param  {Array} array Original array
 * @return {Array}       Copy of array, excluding duplicates
 */
function unique(array) {
	return array.filter(function (item, idx) {
		return array.indexOf(item) === idx;
	});
}

/**

@file kitsy-script-toolkit
@summary makes it easier and cleaner to run code before and after Bitsy functions or to inject new code into Bitsy script tags
@license WTFPL (do WTF you want)
@requires Bitsy Version: 4.5, 4.6
@author @mildmojo

@description
HOW TO USE:
  import {before, after, inject, addDialogTag, addDeferredDialogTag} from "./helpers/kitsy-script-toolkit";

  before(targetFuncName, beforeFn);
  after(targetFuncName, afterFn);
  inject(searchRegex, replaceString);
  addDialogTag(tagName, dialogFn);
  addDeferredDialogTag(tagName, dialogFn);

  For more info, see the documentation at:
  https://github.com/seleb/bitsy-hacks/wiki/Coding-with-kitsy
*/

// Ex: inject(/(names.sprite.set\( name, id \);)/, '$1console.dir(names)');
function inject$1(searchRegex, replaceString) {
	var kitsy = kitsyInit();
	if (
		!kitsy.queuedInjectScripts.some(function (script) {
			return searchRegex.toString() === script.searchRegex.toString() && replaceString === script.replaceString;
		})
	) {
		kitsy.queuedInjectScripts.push({
			searchRegex: searchRegex,
			replaceString: replaceString,
		});
	} else {
		console.warn('Ignored duplicate inject');
	}
}

// Ex: before('load_game', function run() { alert('Loading!'); });
//     before('show_text', function run(text) { return text.toUpperCase(); });
//     before('show_text', function run(text, done) { done(text.toUpperCase()); });
function before(targetFuncName, beforeFn) {
	var kitsy = kitsyInit();
	kitsy.queuedBeforeScripts[targetFuncName] = kitsy.queuedBeforeScripts[targetFuncName] || [];
	kitsy.queuedBeforeScripts[targetFuncName].push(beforeFn);
}

function kitsyInit() {
	// return already-initialized kitsy
	if (bitsy.kitsy) {
		return bitsy.kitsy;
	}

	// Initialize kitsy
	bitsy.kitsy = {
		queuedInjectScripts: [],
		queuedBeforeScripts: {},
		queuedAfterScripts: {},
	};

	var oldStartFunc = bitsy.startExportedGame;
	bitsy.startExportedGame = function doAllInjections() {
		// Only do this once.
		bitsy.startExportedGame = oldStartFunc;

		// Rewrite scripts and hook everything up.
		doInjects();
		applyAllHooks();

		// Start the game
		bitsy.startExportedGame.apply(this, arguments);
	};

	return bitsy.kitsy;
}

function doInjects() {
	bitsy.kitsy.queuedInjectScripts.forEach(function (injectScript) {
		inject(injectScript.searchRegex, injectScript.replaceString);
	});
	reinitEngine();
}

function applyAllHooks() {
	var allHooks = unique(Object.keys(bitsy.kitsy.queuedBeforeScripts).concat(Object.keys(bitsy.kitsy.queuedAfterScripts)));
	allHooks.forEach(applyHook);
}

function applyHook(functionName) {
	var functionNameSegments = functionName.split('.');
	var obj = bitsy;
	while (functionNameSegments.length > 1) {
		obj = obj[functionNameSegments.shift()];
	}
	var lastSegment = functionNameSegments[0];
	var superFn = obj[lastSegment];
	var superFnLength = superFn ? superFn.length : 0;
	var functions = [];
	// start with befores
	functions = functions.concat(bitsy.kitsy.queuedBeforeScripts[functionName] || []);
	// then original
	if (superFn) {
		functions.push(superFn);
	}
	// then afters
	functions = functions.concat(bitsy.kitsy.queuedAfterScripts[functionName] || []);

	// overwrite original with one which will call each in order
	obj[lastSegment] = function () {
		var returnVal;
		var args = [].slice.call(arguments);
		var i = 0;

		function runBefore() {
			// All outta functions? Finish
			if (i === functions.length) {
				return returnVal;
			}

			// Update args if provided.
			if (arguments.length > 0) {
				args = [].slice.call(arguments);
			}

			if (functions[i].length > superFnLength) {
				// Assume funcs that accept more args than the original are
				// async and accept a callback as an additional argument.
				return functions[i++].apply(this, args.concat(runBefore.bind(this)));
			}
			// run synchronously
			returnVal = functions[i++].apply(this, args);
			if (returnVal && returnVal.length) {
				args = returnVal;
			}
			return runBefore.apply(this, args);
		}

		return runBefore.apply(this, arguments);
	};
}

function reinitEngine() {
	// recreate the script and dialog objects so that they'll be
	// referencing the code with injections instead of the original
	bitsy.scriptModule = new bitsy.Script();
	bitsy.scriptInterpreter = bitsy.scriptModule.CreateInterpreter();

	bitsy.dialogModule = new bitsy.Dialog();
	bitsy.dialogRenderer = bitsy.dialogModule.CreateRenderer();
	bitsy.dialogBuffer = bitsy.dialogModule.CreateBuffer();
}

/**
🏁
@file transparent sprites
@summary makes all sprites have transparent backgrounds
@license MIT
@version auto
@requires Bitsy Version: 6.1
@author Sean S. LeBlanc

@description
Makes all sprites have transparent backgrounds.
i.e. tiles can be seen underneath the player, sprites, and items.

HOW TO USE:
1. Copy-paste this script into a script tag after the bitsy source
2. Edit hackOptions below as needed
*/

var hackOptions = {
	isTransparent: function (drawing) {
		// return drawing.name == 'tea'; // specific transparent drawing
		// return ['tea', 'flower', 'hat'].indexOf(drawing.name) !== -1; // specific transparent drawing list
		// return drawing.name && drawing.name.indexOf('TRANSPARENT') !== -1; // transparent drawing flag in name
		return true; // all drawings are transparent
	},
};

var madeTransparent;
var makeTransparent;
before('onready', function () {
	madeTransparent = {};
	makeTransparent = false;
});
before('renderer.GetImage', function (drawing, paletteId, frameOverride) {
	// check cache first
	var cache = madeTransparent[drawing.drw] = madeTransparent[drawing.drw] || {};
	var p = cache[paletteId] = cache[paletteId] || {};
	var frameIndex = frameOverride || drawing.animation.frameIndex;
	var source = bitsy.renderer.GetImageSource(drawing.drw);
	if (p[frameIndex] === source) {
		// already made this transparent
		return;
	}

	// flag the next draw as needing to be made transparent
	p[frameIndex] = source;
	makeTransparent = hackOptions.isTransparent(drawing);
});

before('drawTile', function (canvas) {
	if (makeTransparent) {
		// redraw with all bg pixels transparent
		var ctx = canvas.getContext('2d');
		var data = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var bg = bitsy.getPal(bitsy.getRoomPal(bitsy.player().room))[0];
		for (let i = 0; i < data.data.length; i += 4) {
			var r = data.data[i];
			var g = data.data[i + 1];
			var b = data.data[i + 2];
			if (r === bg[0] && g === bg[1] && b === bg[2]) {
				data.data[i + 3] = 0;
			}
		}
		ctx.putImageData(data, 0, 0);
		// clear the flag
		makeTransparent = false;
	}
});





// pass through transparent sprites option
hackOptions.isTransparent = function (drawing) {
	return hackOptions$1.isTransparent(drawing);
};

inject$1(/ctx.fillRect(\(0,0,canvas.width,canvas.height\);)/g, 'ctx.clearRect$1');
inject$1(/context.fillRect(\(0,0,canvas.width,canvas.height\);)/g, 'context.clearRect$1');

exports.hackOptions = hackOptions$1;

Object.defineProperty(exports, '__esModule', { value: true });

}(this.hacks.transparent_background = this.hacks.transparent_background || {}, window));
