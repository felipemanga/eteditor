# ETEditor
Editor of EveryThing - v0.5

ETEditor is intended to be an online suite of tools with no back-end.
It can be used [right here!](http://felipemanga.github.io/eteditor) Check it out!
Do note, it's still under heavy development and bugs are expected. It requires an up-to-date browser (preferably Chrome), so be sure you're using the latest version.
Please tell me about any bugs you find and be sure to save often!

Right now ETEditor has the following main features:
 1. [sprite editor](#spriteeditor)
 2. [javascript-as-PNG encoder](#minijs)
 3. [standalone javascript editor](#jsedit)
 4. [project editor](#projectedit)

While ETEditor is in alpha state the latest stable version is the gh-pages branch, while master is being used for development.

## <a id="spriteeditor"></a> Sprite Editor
This editor's interface is especially designed to be usable on a small, high-rez
screen, like those on the MS Surface Pro or Samsung Galaxy Note tablets.

Implemented features:
- open images from url: eteditor/?p=sprite&u=http://site/image.jpg
- custom brushes
- unlimited raster layers
- layer blending modes
- layer alpha
- reference image as background for quick and easy Rotoscoping
- stylus pressure support (only works in IE for now, Chrome & Firefox are still working on the APIs)
- animation
 - onionskinning
 - preview
- filters. Easily customize or code your own!
- lots of keyboard shortcuts
- resize image using Nearest-Neighbor for PixelArt.
- toggle between the last two tools used (Shortcut: X)
- menu button hides clutter (Shortcut: Tab)
- tools:
 - Pencil/Line/Brush/Spraycan (Shortcut: B)
 - Eraser (Shortcut: E)
 - Dropper (Shortcut: Alt)
 - Fill bucket (Shortcut: G)
 - Select
 - Hand (Shortcuts: Spacebar to pan, Mousewheel to zoom, Pinch to pan and zoom )
 - Move
- file importing:
 - JPG
 - PNG
- file exporting:
 - JPG
 - PNG
 - JPG+JSON / PNG+JSON texture atlas for animation
 - GIF (with animation support)

To-do, in no particular order:
 - Adjustment layers
 - Brush scaling
 - blur tool
 - clone stamp
 - better color palette window
 - tool preview overlay. Necessary for Pencil, Eraser and Select.
 - animation: import spritesheet support
 - animation: layer references
 - animation: action list
 - reference image - tile mode
 - reference image - use webcam
 - Resize image dialogue
 - tool - dropper color preview
 - clipboard support
 - filter preview
 - app icon and logo
 - text tool
 - left-hand mode

 Known issues:
 - Stuff looks blurry in IE. Because IE.

Feel free to make feature requests.

## <a id="minijs"></a> MiniJS Javascript-to-PNG Codec
Drag and drop Javascript files into this utility. It will merge them all and
output a nicely compressed PNG and a tiny decoder script. Just embed the decoder
in your HTML and it will decompress and execute all your JS code.
This is useful in situations where diskspace is limited. If your JS is on a
server, GZIP encoding is probably a better idea. If your game is going to be
installed on a small drive, you probably don't want it at the top of the applications-taking-up-most-space list. In this case, compressing with PNG makes sense.

## <a id="jsedit"></a> JavaScript Editor
This is a simple utility for testing / profiling JavaScript code.
Press Ctrl+Enter to execute your code. It executes inside a function, so use return values or console.log to see the result. Closing the console clears the log.

You can use #include preprocessor directives to embed external JS files into whatever you're writing, like this:
#include "http://site/a.js"
#include "js/three.js"
console.log(a, THREE);

Now includes a share button, so you can share code snippets with others! Also supports opening scripts through the URL: eteditor/?p=ide&u=http://site/a.js


## <a id="projectedit"></a> Project Editor
In progress.

## Future
The following is a list of things that I intend to add to ETEditor in the near future:
- Voxel Editing. A prototype has already been built.
- Vector Editing.
- AppInventor2 Editing. Based on my AppInventor2HTML5 project, also on Github.
- Multi-File JavaScript Editing. For making games entirely within ETEditor.
- Google Drive / Dropbox support for storing large projects.

## Libraries
This project is grateful for, and makes use of, the following libraries:
- CanvasTool.PngEncoder - imaya https://github.com/imaya/CanvasTool.PngEncoder
- gif.js - Johan Nordberg https://github.com/jnordberg/gif.js
- esprima.js - jQuery Foundation http://esprima.org
- ace.js - Ajax.org B.V. https://github.com/ajaxorg/ace
- JSZip - Stuart Knightley http://stuartk.com/jszip
- localforage - Mozilla https://github.com/localForage/localForage
- alloworigin.com - limtaesu http://alloworigin.com
