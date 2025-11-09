class HttpError extends Error {
  constructor(message, httpStatus) {
    super(message);
    this.name = "Http Error";
    this.httpStatus = httpStatus;
  }
}

module.exports = HttpError;
