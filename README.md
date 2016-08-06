# eteditor
Editor of EveryThing - v0.5

ETEditor is intended to be an online suite of tools.
It can be used [right here!](http://felipemanga.github.io/eteditor). Check it out!

Right now it does sprite editing and javascript-as-PNG encoding.

## Sprite Editor
This editor's interface is especially designed to be usable on a small, high-rez
screen, like those on the MS Surface Pro or Samsung Galaxy Note tablets.

Implemented features:
- custom brushes
- unlimited raster layers
- layer blending modes
- layer alpha
- reference image as background for quick and easy Rotoscoping
- animation
 - onionskinning
 - preview
- filters. Easily customize or code your own!
- lots of keyboard shortcuts
- resize image using Nearest-Neighbor for PixelArt.
- toggle between the last two tools used (Shortcut: X)
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

To-Do:
 - stylus pressure detection (browsers don't have an API for this yet)
 - tool preview overlay. Necessary for Pencil, Eraser and Select.
 - animation - layer references
 - animation - action list
 - reference image - tile mode
 - reference image - use webcam
 - Resize dialogue
 - Brush scaling
 - tool - dropper color preview
 - clipboard support
 - filter preview
 - app icon and logo
 - text tool

## MiniJS Javascript-to-PNG Codec
Drag and drop Javascript files into this utility. It will merge them all and
output a nicely compressed PNG and a tiny decoder script. Just embed the decoder
in your HTML and it will decompress and execute all your JS code.
This is useful in situations where diskspace is limited. If your JS is on a
server, GZIP encoding is probably a better idea. If your game is going to be
installed on a small drive, you probably don't want it at the top of the applications-taking-up-most-space list. In this case, compressing with PNG makes sense.
