const vt = require('vt'),
  ScreenBuffer = require('screen-buffer'),
  EventEmitter = require('events').EventEmitter,
  inherits = require('util').inherits;

// # new HeadlessTerminal(cols, rows)
//
// A headless terminal is a terminal with an internal screen buffer.
//
// When the display is changed, the `change` event is emitted
// with the display buffer as an argument.
//
// __Note:__ Since v0.3 the API has been _completely changed_.
//
//
// ## Usage
//
// ```javascript
// var HeadlessTerminal = require('headless-terminal')
// var terminal = new HeadlessTerminal(80, 25)
// terminal.write('write some data and ansi code')
// console.log(terminal.displayBuffer.toString())
// ```
//
class HeadlessTerminal extends EventEmitter {
  constructor(cols, rows, ScreenBufferConstructor) {
    super();
    this.termBuffer = new vt.TermBuffer(cols, rows);
    this.termBuffer.setMode('crlf', true);
    this.termWriter = new vt.TermWriter(this.termBuffer);

    // ## Attributes
    //
    // ### displayBuffer
    //
    // The underlying [screen-buffer](http://github.com/dtinth/screen-buffer)
    //
    if (!ScreenBufferConstructor) ScreenBufferConstructor = ScreenBuffer;
    this.displayBuffer = new ScreenBufferConstructor();
  }

  open() {
    /* nuffink, leaving it here for */
  }

  // ### write(whatever)
  //
  // Writes some thing to the terminal.
  // After that, a change event will be emitted.
  //
  write(whatever) {
    this.termWriter.write(whatever);
    this._check();
  }

  // ### resize(cols, rows)
  //
  // Resizes the size of the terminal.
  // After that, a change event will be emitted.
  //
  resize(cols, rows) {
    this.termBuffer.resize(cols, rows);
    this._check();
  }

  _check() {
    const screen = this.displayBuffer,
      buffer = this.termBuffer,
      height = buffer.height;
    screen.setRows(height);
    for (let i = 0; i < height; i++) {
      const line = buffer.getLine(i);
      screen.update(i, this._convertLine(line));
    }
    screen.cursorX = buffer.cursor.x;
    screen.cursorY = buffer.cursor.y;

    // ## Events
    //
    // ### 'change' (buffer)
    //
    // Emitted when something is written to the terminal.
    // The first argument will be the underlying screen-buffer.
    //
    this.emit('change', this.displayBuffer, 0, height - 1);
  }

  _convertLine(line) {
    const chars = [],
      str = pad(line.str, this.termBuffer.width),
      attr = null;

    const length = str.length;
    chars.length = length;
    for (let i = 0; i < length; i++) {
      if (line.attr[i]) attr = line.attr[i];
      chars[i] = [this._convertAttribute(attr), str.charAt(i)];
    }

    return chars;
  }

  _convertAttribute(attr) {
    const fg = attr && attr.fg != null ? attr.fg : 257,
      bg = attr && attr.bg != null ? attr.bg : 256,
      inverse = attr && attr.inverse ? 1 : 0,
      underline = attr && attr.underline ? 1 : 0,
      bold = attr && attr.bold ? 1 : 0;
    return (inverse << 20) | (underline << 19) | (bold << 18) | (fg << 9) | bg;
  }
}

function pad(str, width) {
  if (str.length >= width) return str;
  const howMany = width - str.length;
  return str + new Array(howMany + 1).join(' ');
}

module.exports = HeadlessTerminal;

// ## License
//
// MIT
//
