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

While ETEditor is in alpha state the latest stable version is the gh-pages branch, while master is being used for development. It's just simpler to get things done this way, for now.

## <a id="spriteeditor"></a> Sprite Editor
This editor's interface is especially designed to be usable on a small, high-rez
screen, like those on the MS Surface Pro or Samsung Galaxy Note tablets. I haven't actually tested this on a Note, though. If anyone does, I'd be glad to hear feedback.

Implemented features:
- open images from url, provided the target server allows cross-domain requests: eteditor/?p=sprite&u=http://site/image.jpg
- custom brushes with scaling
- unlimited raster layers
- layer blending modes
- layer alpha
- reference image as background for quick and easy Rotoscoping
- stylus pressure support (only works in IE for now, Chrome & Firefox are still working on the APIs)
- animation
 - onionskinning
 - preview
- mirrored drawing for pencil and eraser
- filters. Easily customize or code your own!
- lots of keyboard shortcuts (see below)
- resize image using Nearest-Neighbor for PixelArt.
- toggle between the last two tools used (Shortcut: X)
- menu button hides clutter (Shortcut: Tab)
- clipboard support (Control + C, Control + X, Control + V)
- tools:
 - Pencil/Line/Brush/Spraycan (Shortcut: B)
 - Eraser (Shortcut: E)
 - Dropper (Shortcut: hold D)
 - Fill bucket (Shortcut: F)
 - Select (Shortcut: S)
 - Hand (Shortcuts: hold Spacebar to pan, Mousewheel to zoom, Pinch to pan and zoom )
 - Move (Shortcut: hold Control)
- file importing:
 - JPG
 - PNG
- file exporting:
 - JPG
 - PNG
 - JPG+JSON / PNG+JSON texture atlas for animation
 - GIF (with animation support)

Other Keyboard Shortcuts:
 - Layer shortcuts:
  - Toggle current layer visibility: Shift + Spacebar
  - Move up one layer: Shift + up arrow
  - Move down one layer: Shift + down arrow
  - Move current layer up: Shift + alt + up arrow
  - Move current layer down: Shift + alt + down arrow
  - Merge current layer with the one above: Shift + Control + up arrow
  - Merge current layer with the one below: Shift + Control + down arrow
  - Add new layer: Shift + N
  - Delete current layer: Shift + Delete
  - Duplicate current layer: Shift + D
 - Animation shortcuts:
  - Next frame: right arrow
  - Previous frame: left arrow
  - Duplicate current frame: Alt + N
 - Selection shortcuts:
  - Select All: Control + A
  - Select None: Control + D
  - Activate rectangle selection tool: S
 - Zoom shortcuts:
  - Zoom In: Control + Plus (not on the keypad)
  - Zoom Out: Control + Minus (not on the keypad)
  - Zoom Toggle Fit and 1:1: Control + 0 (not on the keypad)

To-do, in no particular order:
 - blur tool
 - clone stamp
 - text tool
 - Adjustment layers
 - Vector layers
 - 3D layers
 - better color palette window
 - animation: import spritesheet support
 - animation: layer references
 - animation: action list
 - reference image - tile mode
 - reference image - use webcam
 - Resize image dialogue
 - filter preview
 - left-hand mode

Known issues:
 - Stuff looks blurry in IE. Because IE.
 - Chrome and Firefox don't support pen pressure yet.
 - dragging / resizing windows on Android is slow.

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

You can use #include preprocessor directives to embed external JS files into whatever you're writing, like this: #include "http://site/a.js"
or with a relative path: #include "js/three.js"

Now includes a share button, so you can share code snippets with others! Also supports opening scripts through the URL: eteditor/?p=ide&u=http://site/a.js


## <a id="projectedit"></a> Project Editor
This editor is for making HTML5 games. You can add images, HTML, CSS and JavaScript files and it will bundle them up in a way that works offline (even using "file://" urls).
[Here](https://felipemanga.github.io/eteditor/?p=projman&os=9ge6zeyhisg2pcpb7rpfowvnt11lci) is one of the Phaser.js examples, with some very slight modifications (using FS.URL["file.png"]
instead of simply "file.png").
To run a game, click on Load in the rightmost pane, or type Ctrl+Enter in a code pane.
When you want to export the project, you have two options in the main menu: SimpleHTML and AdvancedHTML.
In both cases, all javascript code will be minimized with Google's Closure compiler. SimpleHTML uses Closure's SIMPLE_OPTIMIZATIONS flag, which minimizes most code without breaking it. AdvancedHTML does much more aggressive minimization and code has to be written with this in mind so as not to break.
If you wish to export the example above, you must use the SimpleHTML option, as Phaser.js does not survive an advanced minimization.

In the file list you can upload, rename (Double-click a file), and delete files.
When you click on an image file, you'll see a preview with options for:
- editing: will open the Sprite editor in a new tab. After you save, click "reload" in the preview.
- embedding the image into the HTML: Useful for HTML5 projects that need to run without a server.

Known issues:
- Undo/Redo gets messed up when you navigate from one JS file to another.

## Future
The following is a list of things that I intend to add to ETEditor in the near future:
- Voxel Editing. A prototype has already been built.
- Vector Editing.
- AppInventor2 Editing. Based on my AppInventor2HTML5 project, also on Github.
- Google Drive / Dropbox support for storing large projects.

## Libraries
This project is grateful for, and makes use of, the following libraries:
- CanvasTool.PngEncoder - imaya https://github.com/imaya/CanvasTool.PngEncoder
- gif.js - Johan Nordberg https://github.com/jnordberg/gif.js
- esprima.js - jQuery Foundation http://esprima.org
- ace.js - Ajax.org B.V. https://github.com/ajaxorg/ace
- JSZip - Stuart Knightley http://stuartk.com/jszip
- localforage - Mozilla https://github.com/localForage/localForage
