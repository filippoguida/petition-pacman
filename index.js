const db = require("./modules/db");
const cookies = require("./middelware/cookies");
const auth = require("./middelware/auth");
const rq = require("./middelware/requirements");
const handlebars = require("express-handlebars");
const express = require("express");

const app = express();
app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

app.use(express.static("public"));
app.use(cookies);
app.use(auth);

app.get("/", rq.toLogin);
app.get("/login", rq.requireNoLogIn, rq.renderPage);
app.get("/logout", rq.requireLogIn, rq.logOut, rq.toLogin);
app.post("/login", rq.requireNoLogIn, (req, res) => {
    db.getUserId(req.body)
        .then(id => {
            req.session.id = id;
            res.redirect("/petition");
        })
        .catch(() => res.render("login", { error: true }));
});
app.get("/registration", rq.requireNoLogIn, rq.renderPage);
app.post("/registration", rq.requireNoLogIn, (req, res) => {
    db.addUser(req.body)
        .then(id => {
            req.session.id = id;
            res.redirect("/petition");
        })
        .catch(() => res.render("registration", { error: true }));
});
app.get("/profile/edit", rq.requireLogIn, (req, res) => {
    db.getUserData(req.session.id)
        .then(data => {
            res.render("editprofile", data);
        })
        .catch(() => res.sendStatus(500));
});
app.post("/profile/edit", rq.requireLogIn, (req, res) => {
    db.setUserData(req.session.id, req.body);
    res.redirect("/petition");
});

app.get("/petition", rq.requireLogIn, rq.requireNoSig, rq.renderPage);
app.post("/petition", (req, res) => {
    db.addSignature({ signature: req.body.signature, id: req.session.id })
        .then(() => {
            req.session.signed = true;
            res.redirect("/thanks");
        })
        .catch(() => res.render("petition", { error: true }));
});
app.get("/thanks", rq.requireLogIn, rq.requireSig, (req, res) => {
    db.getSignature(req.session.id)
        .then(signature => {
            req.session.signed = true;
            res.render("thanks", { signature });
        })
        .catch(() => res.render("petition", { error: true }));
});
app.get(
    ["/signers", "/signers/:city"],
    rq.requireLogIn,
    rq.requireSig,
    (req, res) => {
        db.getSigners()
            .then(signers => res.render("signers", { signers }))
            .catch(() => res.sendStatus(500));
    }
);
app.post("/signature/delete", rq.requireLogIn, rq.requireSig, (req, res) => {
    db.deleteSignature(req.session.id)
        .then(() => {
            req.session.signed = null;
            res.redirect("/petition");
        })
        .catch(() => res.sendStatus(500));
});

app.listen(process.env.PORT || 8080);
