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

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
    cookieSession({
        keys: [`coriander-petition-filippoguida-secret`],
        maxAge: 1000 * 60 * 60 * 24 * 14 //2 weeks
    })
);

app.use(csurf());
app.use((req, res, next) => {
    res.set("x-frame-options", "DENY");
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.get("/registration", (req, res) => {
    if (req.session.id) res.redirect("/petition");
    else res.render("registration");
});

app.post("/registration", (req, res) => {
    db.addUser(req.body)
        .then(id => {
            req.session.id = id;
            res.redirect("/petition");
        })
        .catch(err => console.log(err)); // res.render("registration", { error: true }));
});

app.get("/login", (req, res) => {
    if (req.session.id) res.redirect("/petition");
    else res.render("login");
});

app.post("/login", (req, res) => {
    db.getUserToken(req.body)
        .then(id => {
            req.session.id = id;
            res.redirect("/petition");
        })
        .catch(() => res.render("login", { error: true }));
});

app.get("/petition", (req, res) => {
    if (!req.session.id) res.redirect("/login");
    else if (req.session.signature) res.redirect("/thanks");
    else
        db.getSignature(req.session.id)
            .then(signature => {
                req.session.signature = signature;
                res.redirect("/thanks");
            })
            .catch(() => res.render("petition"));
});

app.post("/petition", (req, res) => {
    db.addSignature(req.body)
        .then(signature => {
            req.session.signature = signature;
            res.redirect("/thanks");
        })
        .catch(() => res.render("petition", { error: true }));
});

app.get("/thanks", (req, res) => {
    console.log(req.session);
    if (!req.session.id) res.redirect("/registration");
    else if (!req.session.signature) res.redirect("/petition");
    else res.render("thanks", { signature: req.session.signature });
});

app.get("/signers", (req, res) => {
    if (!req.session.id) res.redirect("/registration");
    else if (!req.session.signature) res.redirect("/petition");
    else
        db.getSigners()
            .then(signers => res.render("signers", { signers }))
            .catch(() => res.sendStatus(500));
});

app.listen(8080, () => {
    console.log("Server is listening on port 8080");
});
