/// <reference path="./steps.d.ts" />
const express = require("express");

BeforeSuite((I) => {
    const app = express()
    app.use(express.static('public'))
    app.listen(3456)
});

Feature('Connection');

Scenario('Data Channel ping pong', async (I) => {
    I.amOnPage("http://localhost:3456")
    I.wait(2)
    I.openNewTab();
    I.amOnPage("http://localhost:3456")
    I.wait(2)
    const id2 = await I.grabTextFrom("#id")
    I.switchToPreviousTab(1)
    I.wait(1)
    I.executeScript(`connect("${id2}")`)
    I.wait(2)
    I.see("pong")
});

AfterSuite((I) => {
    process.exit(0)
})