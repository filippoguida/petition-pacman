const db = require("./modules/db");
const cookies = require("./routers/cookiesRouter");
const auth = require("./routers/authRouter");
const mw = require("./middelware");
const handlebars = require("express-handlebars");
const express = require("express");

const app = express();
app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

app.use(express.static("public"));
app.use(cookies);
app.use(auth);

app.get("/", mw.toLogin);
app.get("/login", mw.requireNoLogIn, mw.renderPage);
app.get("/logout", mw.requireLogIn, mw.logOut, mw.toLogin);
app.post("/login", mw.requireNoLogIn, (req, res) => {
    db.getUserId(req.body)
        .then(id => {
            req.session.id = id;
            res.redirect("/petition");
        })
        .catch(() => res.render("login", { error: true }));
});

app.get("/registration", mw.requireNoLogIn, mw.renderPage);
app.post("/registration", mw.requireNoLogIn, (req, res) => {
    db.addUser(req.body)
        .then(id => {
            req.session.id = id;
            res.redirect("/profile");
        })
        .catch(() => res.render("registration", { error: true }));
});
app.get("/profile", mw.requireLogIn, mw.renderPage);
app.post("/profile", (req, res) => {
    db.addUserProfile(req.session.id, req.body);
    res.redirect("/petition");
});
app.get("/profile/edit", mw.requireLogIn, (req, res) => {
    db.getUserData(req.session.id)
        .then(data => {
            res.render("editprofile", data);
        })
        .catch(() => res.sendStatus(500));
});
app.post("/profile/edit", mw.requireLogIn, (req, res) => {
    db.setUserData(req.session.id, req.body);
    res.redirect("/petition");
});

app.get("/petition", mw.requireLogIn, mw.requireNoSig, mw.renderPage);
app.post("/petition", (req, res) => {
    db.addSignature({ signature: req.body.signature, id: req.session.id })
        .then(() => {
            req.session.signed = true;
            res.redirect("/thanks");
        })
        .catch(() => res.render("petition", { error: true }));
});
app.get("/thanks", mw.requireLogIn, mw.requireSig, (req, res) => {
    db.getSignature(req.session.id)
        .then(signature => {
            req.session.signed = true;
            res.render("thanks", { signature });
        })
        .catch(() => res.render("petition", { error: true }));
});
app.get(
    ["/signers", "/signers/:city"],
    mw.requireLogIn,
    mw.requireSig,
    (req, res) => {
        db.getSigners()
            .then(signers => res.render("signers", { signers }))
            .catch(() => res.sendStatus(500));
    }
);
app.post("/signature/delete", mw.requireLogIn, mw.requireSig, (req, res) => {
    db.deleteSignature(req.session.id)
        .then(() => {
            req.session.signed = null;
            res.redirect("/petition");
        })
        .catch(() => res.sendStatus(500));
});

app.listen(process.env.PORT || 8080);
