module.exports = function (req, res, next) {
  if (!req.user.roles.includes("System Admin"))
    return res.status(403).send("Action denied for user");

  next();
};
