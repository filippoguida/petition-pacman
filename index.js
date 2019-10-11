const db = require("./db");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const handlebars = require("express-handlebars");
const express = require("express");
const app = express();

app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

app.use(express.static("public"));

app.use(
    cookieSession({
        secret: `coriander-petition-filippoguida-secret`,
        maxAge: 1000 * 60 * 60 * 24 * 14 //2 weeks
    })
);
app.use(bodyParser.urlencoded({ extended: false }));

app.use(csurf());
app.use((req, res, next) => {
    res.set("x-frame-options", "DENY");
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.get("/", (req, res) => {
    if (req.session.id) res.redirect("/petition");
    else res.redirect("/login");
});

app.get("/registration", (req, res) => {
    if (req.session.id) res.redirect("/petition");
    else res.render("registration");
});

app.post("/registration", (req, res) => {
    db.addUser(req.body)
        .then(id => {
            req.session.id = id;
            res.redirect("/profile");
        })
        .catch(() => res.render("registration", { error: true }));
});

app.get("/profile", (req, res) => {
    if (!req.session.id) res.redirect("/login");
    else res.render("profile");
});

app.post("/profile", (req, res) => {
    db.addUserProfile(req.session.id, req.body);
    res.redirect("/petition");
});

app.get("/login", (req, res) => {
    if (req.session.id) res.redirect("/petition");
    else res.render("login");
});

app.post("/login", (req, res) => {
    db.getUserId(req.body)
        .then(id => {
            req.session.id = id;
            res.redirect("/petition");
        })
        .catch(() => res.render("login", { error: true }));
});

app.get("/petition", (req, res) => {
    if (!req.session.id) res.redirect("/login");
    else if (req.session.signed) res.redirect("/thanks");
    else res.render("petition");
});

app.post("/petition", (req, res) => {
    db.addSignature({ signature: req.body.signature, id: req.session.id })
        .then(() => {
            req.session.signed = true;
            res.redirect("/thanks");
        })
        .catch(() => res.render("petition", { error: true }));
});

app.get("/thanks", (req, res) => {
    if (!req.session.id) res.redirect("/login");
    else if (!req.session.signed) res.redirect("/petition");
    else
        db.getSignature(req.session.id)
            .then(signature => {
                req.session.signed = true;
                res.render("thanks", { signature });
            })
            .catch(() => res.render("petition", { error: true }));
});

app.get("/signers", (req, res) => {
    if (!req.session.id) res.redirect("/login");
    else if (!req.session.signed) res.redirect("/petition");
    else
        db.getSigners()
            .then(signers => res.render("signers", { signers }))
            .catch(() => res.sendStatus(500));
});

app.get("/signers/:city", (req, res) => {
    if (!req.session.id) res.redirect("/login");
    else if (!req.session.signed) res.redirect("/petition");
    else
        db.getSigners()
            .then(signers => res.render("signers", { signers }))
            .catch(() => res.sendStatus(500));
});

app.get("/unsign", (req, res) => {
    if (!req.session.id) res.redirect("/login");
    else if (!req.session.signed) res.redirect("/petition");
    else
        db.deleteSignature(req.session.id)
            .then(() => res.redirect("/petition"))
            .catch(() => res.sendStatus(500));
});

app.get("/logout", (req, res) => {
    if (!req.session.id) res.redirect("/login");
    else req.session = null;
    res.redirect("/login");
});

app.get("/edit", (req, res) => {
    if (!req.session.id) res.redirect("/login");
    else
        db.getUserData(req.session.id)
            .then(data => {
                res.render("edit", data);
            })
            .catch(() => res.sendStatus(500));
});

app.post("/edit", (req, res) => {
    db.setUserData(req.session.id, req.body);
    res.redirect("/petition");
});

app.listen(process.env.PORT || 8080);
