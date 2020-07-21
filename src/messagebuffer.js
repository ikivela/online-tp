const { FSWatcher } = require("chokidar");

class MessageBuffer {
  constructor(delimiter) {
    this.delimiter = delimiter;
    this.buffer = "";
  }

  isFinished() {
    if (this.buffer.length === 0 || this.buffer.indexOf("\x03") > -1) {
      //console.log(".");
      return true;
    }
    return false;
  }

  push(data) {
    this.buffer += data;
  }

  getMessage() {
    const delimiterIndex = this.buffer.indexOf("\x02");
    const delimiterIndex2 = this.buffer.indexOf("\x03");
    if (delimiterIndex !== -1 && delimiterIndex2 !== -1) {
      const message = this.buffer.slice(
        delimiterIndex + 1,
        delimiterIndex2 - 1
      );
      this.buffer = ""; //.replace("\x02" + message + "\x03", "")
      return message;
    }
    return null;
  }

  handleData() {
    /**
     * Try to accumulate the buffer with messages
     *
     * If the server isnt sending delimiters for some reason
     * then nothing will ever come back for these requests
     */
    const message = this.getMessage();
    return message;
  }
}

module.exports = MessageBuffer;
