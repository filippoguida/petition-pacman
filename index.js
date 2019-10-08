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

app.get("/petition", (req, res) => {
    if (!req.session.id) res.render("petition");
    else res.redirect("/thanks");
});

app.post("/petition", (req, res) => {
    db.addSignature(req.body, {
        success: id => {
            req.session.id = id;
            res.redirect("/thanks");
        },
        error: () => res.render("petition", { error: true })
    });
});

app.get("/thanks", (req, res) => {
    if (!req.session.id) res.redirect("/petition");
    else
        db.getSignature(req.session.id, {
            success: signature => res.render("thanks", { signature })
        });
});

app.get("/signers", (req, res) => {
    if (!req.session.id) res.redirect("/petition");
    else
        db.getSigners({
            success: signers => res.render("signers", { signers }),
            error: () => res.sendStatus(500)
        });
});

app.listen(8080, () => {
    console.log("Server is listening on port 8080");
});
