module.exports.requireNoLogIn = (req, res, next) => {
    if (req.session.id) res.redirect("/petition");
    else next();
};

module.exports.requireLogIn = (req, res, next) => {
    if (!req.session.id) res.redirect("/login");
    else next();
};

module.exports.requireNoSig = (req, res, next) => {
    if (req.session.signed) res.redirect("/thanks");
    else next();
};

module.exports.requireSig = (req, res, next) => {
    if (!req.session.signed) res.redirect("/petition");
    else next();
};

module.exports.logIn = (req, res, next) => {
    req.session = null;
    next();
};

module.exports.logOut = (req, res, next) => {
    req.session = null;
    next();
};

module.exports.renderPage = (req, res) => {
    let template = req.originalUrl.replace("/", "");
    res.render(template);
};

module.exports.toLogin = (req, res) => {
    res.redirect("/login");
};
