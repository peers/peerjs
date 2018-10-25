
type ICodeceptCallback = (i: CodeceptJS.I) => void;

declare class FeatureConfig {
  retry(times:number): FeatureConfig
  timeout(seconds:number): FeatureConfig
  config(config:object): FeatureConfig
  config(helperName:string, config:object): FeatureConfig
}

declare class ScenarioConfig {
  throws(err:any) : ScenarioConfig;
  fails() : ScenarioConfig;
  retry(times:number): ScenarioConfig
  timeout(timeout:number): ScenarioConfig
  inject(inject:object): ScenarioConfig
  config(config:object): ScenarioConfig
  config(helperName:string, config:object): ScenarioConfig
}

interface ILocator {
  xpath?: string;
  css?: string;
  name?: string;
  value?: string;
  frame?: string;
  android?: string;
  ios?: string;
}

declare class Helper {
  /** Abstract method to provide required config options */
  static _config(): any;
  /** Abstract method to validate config */
  _validateConfig<T>(config: T): T;
  /** Sets config for current test */
  _setConfig(opts: any): void;
  /** Hook executed before all tests */
  _init(): void
  /** Hook executed before each test. */
  _before(): void
  /** Hook executed after each test */
  _after(): void
  /**
   * Hook provides a test details
   * Executed in the very beginning of a test
   */
  _test(test): void
  /** Hook executed after each passed test */
  _passed(test: () => void): void
  /** Hook executed after each failed test */
  _failed(test: () => void): void
  /** Hook executed before each step */
  _beforeStep(step: () => void): void
  /** Hook executed after each step */
  _afterStep(step: () => void): void
  /** Hook executed before each suite */
  _beforeSuite(suite: () => void): void
  /** Hook executed after each suite */
  _afterSuite(suite: () => void): void
  /** Hook executed after all tests are executed */
  _finishTest(suite: () => void): void
  /**Access another configured helper: this.helpers['AnotherHelper'] */
  helpers(): any
  /** Print debug message to console (outputs only in debug mode) */
  debug(msg: string): void

  debugSection(section: string, msg: string): void
}

declare class Locator implements ILocator {
  xpath?: string;
  css?: string;
  name?: string;
  value?: string;
  frame?: string;
  android?: string;
  ios?: string;

  or(locator:string): Locator;
  find(locator:string): Locator;
  withChild(locator:string): Locator;
  find(locator:string): Locator;
  at(position:number): Locator;
  first(): Locator;
  last(): Locator;
  inside(locator:string): Locator;
  before(locator:string): Locator;
  after(locator:string): Locator;
  withText(locator:string): Locator;
  withAttr(locator:object): Locator;
  as(locator:string): Locator;
}

declare function actor(customSteps?: {}): CodeceptJS.I;
declare function Feature(title: string, opts?: {}): FeatureConfig;
declare const Scenario: {
	(title: string, callback: ICodeceptCallback): ScenarioConfig;
	(title: string, opts: {}, callback: ICodeceptCallback): ScenarioConfig;
	only(title: string, callback: ICodeceptCallback): ScenarioConfig;
	only(title: string, opts: {}, callback: ICodeceptCallback): ScenarioConfig;
}
declare function xScenario(title: string, callback: ICodeceptCallback): ScenarioConfig;
declare function xScenario(title: string, opts: {}, callback: ICodeceptCallback): ScenarioConfig;
declare function Data(data: any): any;
declare function xData(data: any): any;
declare function Before(callback: ICodeceptCallback): void;
declare function BeforeSuite(callback: ICodeceptCallback): void;
declare function After(callback: ICodeceptCallback): void;
declare function AfterSuite(callback: ICodeceptCallback): void;

declare function locate(selector: string): Locator;
declare function locate(selector: ILocator): Locator;
declare function within(selector: string, callback: Function): Promise<any>;
declare function within(selector: ILocator, callback: Function): Promise<any>;
declare function session(selector: string, callback: Function): Promise<any>;
declare function session(selector: ILocator, callback: Function): Promise<any>;
declare function session(selector: string, config: any, callback: Function): Promise<any>;
declare function session(selector: ILocator, config: any, callback: Function): Promise<any>;
declare function pause(): void;

declare const codeceptjs: any;

declare namespace CodeceptJS {
  export interface I {
    defineTimeout(timeouts: string) : void,
    amOnPage(url: string) : void,
    click(locator: ILocator, context?: ILocator) : void,
    click(locator: string, context?: ILocator) : void,
    click(locator: ILocator, context?: string) : void,
    click(locator: string, context?: string) : void,
    doubleClick(locator: ILocator, context?: ILocator) : void,
    doubleClick(locator: string, context?: ILocator) : void,
    doubleClick(locator: ILocator, context?: string) : void,
    doubleClick(locator: string, context?: string) : void,
    rightClick(locator: ILocator) : void,
    rightClick(locator: string) : void,
    fillField(field: ILocator, value: string) : void,
    fillField(field: string, value: string) : void,
    appendField(field: ILocator, value: string) : void,
    appendField(field: string, value: string) : void,
    clearField(field: ILocator) : void,
    clearField(field: string) : void,
    selectOption(select: ILocator, option: string) : void,
    selectOption(select: string, option: string) : void,
    attachFile(locator: ILocator, pathToFile: string) : void,
    attachFile(locator: string, pathToFile: string) : void,
    checkOption(field: ILocator, context?: ILocator) : void,
    checkOption(field: string, context?: ILocator) : void,
    checkOption(field: ILocator, context?: string) : void,
    checkOption(field: string, context?: string) : void,
    uncheckOption(field: ILocator, context?: ILocator) : void,
    uncheckOption(field: string, context?: ILocator) : void,
    uncheckOption(field: ILocator, context?: string) : void,
    uncheckOption(field: string, context?: string) : void,
    grabTextFrom(locator: ILocator) : Promise<string>,
    grabTextFrom(locator: string) : Promise<string>,
    grabHTMLFrom(locator: ILocator) : Promise<string>,
    grabHTMLFrom(locator: string) : Promise<string>,
    grabValueFrom(locator: ILocator) : Promise<string>,
    grabValueFrom(locator: string) : Promise<string>,
    grabCssPropertyFrom(locator: ILocator, cssProperty: string) : Promise<string>,
    grabCssPropertyFrom(locator: string, cssProperty: string) : Promise<string>,
    grabAttributeFrom(locator: ILocator, attr: string) : Promise<string>,
    grabAttributeFrom(locator: string, attr: string) : Promise<string>,
    seeInTitle(text: string) : void,
    seeTitleEquals(text: string) : void,
    dontSeeInTitle(text: string) : void,
    grabTitle() : Promise<string>,
    see(text: string, context?: ILocator) : void,
    see(text: string, context?: string) : void,
    seeTextEquals(text: string, context?: ILocator) : void,
    seeTextEquals(text: string, context?: string) : void,
    dontSee(text: string, context?: ILocator) : void,
    dontSee(text: string, context?: string) : void,
    seeInField(field: ILocator, value: string) : void,
    seeInField(field: string, value: string) : void,
    dontSeeInField(field: ILocator, value: string) : void,
    dontSeeInField(field: string, value: string) : void,
    seeCheckboxIsChecked(field: ILocator) : void,
    seeCheckboxIsChecked(field: string) : void,
    dontSeeCheckboxIsChecked(field: ILocator) : void,
    dontSeeCheckboxIsChecked(field: string) : void,
    seeElement(locator: ILocator) : void,
    seeElement(locator: string) : void,
    dontSeeElement(locator: ILocator) : void,
    dontSeeElement(locator: string) : void,
    seeElementInDOM(locator: ILocator) : void,
    seeElementInDOM(locator: string) : void,
    dontSeeElementInDOM(locator: ILocator) : void,
    dontSeeElementInDOM(locator: string) : void,
    seeInSource(text: string) : void,
    grabSource() : Promise<string>,
    grabBrowserLogs() : Promise<string>,
    grabCurrentUrl() : Promise<string>,
    grabBrowserUrl() : Promise<string>,
    dontSeeInSource(text: string) : void,
    seeNumberOfElements(selector: string, num: number) : void,
    seeNumberOfVisibleElements(locator: ILocator, num: number) : void,
    seeNumberOfVisibleElements(locator: string, num: number) : void,
    seeCssPropertiesOnElements(locator: ILocator, cssProperties: string) : void,
    seeCssPropertiesOnElements(locator: string, cssProperties: string) : void,
    seeAttributesOnElements(locator: ILocator, attributes: string) : void,
    seeAttributesOnElements(locator: string, attributes: string) : void,
    grabNumberOfVisibleElements(locator: ILocator) : Promise<string>,
    grabNumberOfVisibleElements(locator: string) : Promise<string>,
    seeInCurrentUrl(url: string) : void,
    dontSeeInCurrentUrl(url: string) : void,
    seeCurrentUrlEquals(url: string) : void,
    dontSeeCurrentUrlEquals(url: string) : void,
    executeScript(fn: Function) : void,
    executeAsyncScript(fn: Function) : void,
    scrollTo(locator: ILocator, offsetX?: number, offsetY?: number) : void,
    scrollTo(locator: string, offsetX?: number, offsetY?: number) : void,
    moveCursorTo(locator: ILocator, offsetX?: number, offsetY?: number) : void,
    moveCursorTo(locator: string, offsetX?: number, offsetY?: number) : void,
    saveScreenshot(fileName: string, fullPage?: string) : void,
    setCookie(cookie: string) : void,
    clearCookie(cookie: string) : void,
    seeCookie(name: string) : void,
    dontSeeCookie(name: string) : void,
    grabCookie(name: string) : Promise<string>,
    acceptPopup() : void,
    cancelPopup() : void,
    seeInPopup(text: string) : void,
    grabPopupText() : Promise<string>,
    pressKey(key: string) : void,
    resizeWindow(width: number, height: number) : void,
    dragAndDrop(srcElement: string, destElement: string) : void,
    closeOtherTabs() : void,
    wait(sec: number) : void,
    waitForEnabled(locator: ILocator, sec?: number) : void,
    waitForEnabled(locator: string, sec?: number) : void,
    waitForElement(locator: ILocator, sec?: number) : void,
    waitForElement(locator: string, sec?: number) : void,
    waitUntilExists(locator: ILocator, sec?: number) : void,
    waitUntilExists(locator: string, sec?: number) : void,
    waitInUrl(urlPart: string, sec?: number) : void,
    waitUrlEquals(urlPart: string, sec?: number) : void,
    waitForText(text: string, sec?: number, aContext?: string) : void,
    waitForValue(field: ILocator, value: string, sec?: number) : void,
    waitForValue(field: string, value: string, sec?: number) : void,
    waitForVisible(locator: ILocator, sec?: number) : void,
    waitForVisible(locator: string, sec?: number) : void,
    waitNumberOfVisibleElements(locator: ILocator, num: number, sec?: number) : void,
    waitNumberOfVisibleElements(locator: string, num: number, sec?: number) : void,
    waitForInvisible(locator: ILocator, sec?: number) : void,
    waitForInvisible(locator: string, sec?: number) : void,
    waitToHide(locator: ILocator, sec?: number) : void,
    waitToHide(locator: string, sec?: number) : void,
    waitForStalenessOf(locator: ILocator, sec?: number) : void,
    waitForStalenessOf(locator: string, sec?: number) : void,
    waitForDetached(locator: ILocator, sec?: number) : void,
    waitForDetached(locator: string, sec?: number) : void,
    waitForFunction(fn: Function, argsOrSec?: string, sec?: number) : void,
    waitUntil(fn: Function, sec?: number, timeoutMsg?: string) : void,
    switchTo(locator: ILocator) : void,
    switchTo(locator: string) : void,
    switchToNextTab(num?: number, sec?: number) : void,
    switchToPreviousTab(num?: number, sec?: number) : void,
    closeCurrentTab() : void,
    openNewTab() : void,
    grabNumberOfOpenTabs() : Promise<string>,
    refreshPage() : void,
    scrollPageToTop() : void,
    scrollPageToBottom() : void,
    grabPageScrollPosition() : Promise<string>,
    runOnIOS(caps: string, fn: Function) : void,
    runOnAndroid(caps: string, fn: Function) : void,
    runInWeb(fn: Function) : void,
    debug(msg: string) : void,
    debugSection(section: string, msg: string) : void,
    say(msg: string) : void,
    retryStep(opts: string) : void,

  }

}

declare module "codeceptjs" {
    export = CodeceptJS;
}
