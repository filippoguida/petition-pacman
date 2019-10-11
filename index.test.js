const supertest = require("supertest");
const cookieSession = require("cookie-session");
const app = require("./index");

test("requireLogin redirect to /login", () => {
    cookieSession.mockSessionOnce({});
    return supertest(app)
        .get("/")
        .then(res => {
            expect(res.headers.location).toBe("/login");
            expect(res.statusCode).toBe(302);
        });
});

test("requireNoLogin redirect to /petition", () => {
    cookieSession.mockSessionOnce({
        id: 1
    });
    return supertest(app)
        .get("/login")
        .then(res => {
            expect(res.headers.location).toBe("/petition");
            expect(res.statusCode).toBe(302);
        });
});

test("requireSig redirect to /petition", () => {
    cookieSession.mockSessionOnce({
        id: 1
    });
    return supertest(app)
        .get("/thanks")
        .then(res => {
            expect(res.headers.location).toBe("/petition");
            expect(res.statusCode).toBe(302);
        });
});

test("requireNoSig redirect to /thanks", () => {
    cookieSession.mockSessionOnce({
        id: 1,
        signed: true
    });
    return supertest(app)
        .get("/petition")
        .then(res => {
            expect(res.headers.location).toBe("/thanks");
            expect(res.statusCode).toBe(302);
        });
});

test("POST route for signing the petition", () => {
    cookieSession.mockSessionOnce({
        id: 1,
        signed: false
    });
    let data = {
        signature: "signatureInByte64"
    };
    return supertest(app)
        .post("/petition")
        .send(data)
        .end(res => {
            expect(res.headers.location).toBe("/thanks");
            expect(res.statusCode).toBe(302);
        });
});

test("POST route for signing the petition", () => {
    cookieSession.mockSessionOnce({
        id: 1,
        signed: true
    });
    return supertest(app)
        .post("/petition")
        .end(res => {
            expect(res.body.error).toBe(true);
        });
});
