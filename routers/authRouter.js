const csurf = require("csurf");
const express = require("express");
const router = express.Router();

router.use(csurf());
router.use((req, res, next) => {
    res.set("x-frame-options", "DENY");
    res.locals.csrfToken = req.csrfToken();
    next();
});

module.exports = router;
