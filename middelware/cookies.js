const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const express = require("express");
const router = express.Router();

router.use(
    cookieSession({
        secret: `coriander-petition-filippoguida-secret`,
        maxAge: 1000 * 60 * 60 * 24 * 14 //2 weeks
    })
);
router.use(bodyParser.urlencoded({ extended: false }));

module.exports = router;
