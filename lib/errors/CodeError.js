class CodeError extends Error {
  constructor(message, code) {
    super(JSON.stringify({message: message}));
    this.name = "Application Code Error";
    this.code = code;
  }
}

module.exports = CodeError;
