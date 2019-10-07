const db = require("./db");
const bp = require("body-parser");
const hb = require("express-handlebars");
const express = require("express");
const app = express();

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(express.static(__dirname + "/public"));
app.use(bp.urlencoded({ extended: false }));
app.use(bp.json());

app.get("/petition", (req, res) => {
    res.render("index", {
        layout: "main"
    });
});

app.post("/petition", (req, res) => {
    res.send(db.addSignature(req.body).catch(e => console.log(e)));
});

app.get("/thanks", (req, res) => {
    res.render("thanks", {
        layout: "main"
    });
});

app.listen(8080, () => {
    console.log("Server is listening on port 8080");
});
