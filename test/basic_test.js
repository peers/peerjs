/// <reference path="./steps.d.ts" />
const express = require("express");
const port = Math.floor(Math.random() * (8000 - 2000 + 1)) + 2000;

BeforeSuite((I) => {
    const app = express()
    app.use(express.static('public'))
    app.listen(port)
});

Feature('Connection');

Scenario('Data Channel ping pong', async (I) => {
    I.amOnPage("http://localhost:" + port)
    I.wait(1)
    I.openNewTab();
    I.amOnPage("http://localhost:" + port)
    I.wait(1)
    const id2 = await I.grabTextFrom("#id")
    I.switchToPreviousTab(1)
    I.wait(1)
    I.executeScript(`connect("${id2}")`)
    I.wait(1)
    I.see("pong")
});

AfterSuite((I) => {
    process.exit(0)
})