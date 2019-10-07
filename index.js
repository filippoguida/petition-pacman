const express = require("express");
const hb = require("express-handlebars");
const app = express();

app.use(express.static(__dirname + "/public"));

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.get("/", (req, res) => {
    res.render("index", {
        layout: "main"
    });
});

app.listen(8080, () => {
    console.log("Server is listening on port 8080");
});
