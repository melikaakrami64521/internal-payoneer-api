require('colors')
const fs = require('fs')
const pup = require('puppeteer')

class Parser {
  constructor(config) {
    this.browser = null
    this.page = null
    this.urlLogin = 'https://login.payoneer.com'
    this.urlAccount = 'https://myaccount.payoneer.com'
    this.urlAccountHome = 'https://myaccount.payoneer.com/ma/'
    this.chromePath = null
    this.chromePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ]

    this.config = config || {}
  }

  async connect() {
    this.findChromePath()
    this.browser = await pup.launch({
      executablePath: this.chromePath,
      args: ['--start-maximized', '--disable-blink-features=AutomationControlled', '--disable-infobars'],
      headless: false,
      ignoreDefaultArgs: ['--enable-automation'],
      devtools: true,
      ignoreHTTPSErrors: true,
      defaultViewport: { width: 1920, height: 1080 },
      ...this.config,
    })
    await this.sleep(1)
  }

  async disconnect() {
    this.browser.close()
    this.browser = null
  }

  async createPage() {
    let [page, ...otherPages] = await this.browser.pages()
    this.page = page
  }

  async open() {
    await this.page.goto(this.urlAccount, { waitUntil: 'networkidle0' })
    await this.sleep(10)
  }

  async getCurrentURL() {
    // const url = await this.page.evaluate(() => document.location.href)
    const url = await this.page.url()
    console.log(url.yellow)
    return url
  }

  async checkLoginPage() {
    const url = await this.getCurrentURL()
    return url.includes(this.urlLogin)
  }

  async checkAccountPage() {
    const url = await this.getCurrentURL()
    return url.includes(this.urlAccount)
  }

  async login() {
    // ? CHECK IF THIS IS LOGIN PAGE
    if (!this.checkLoginPage()) return

    const formSelector = '.logInForm > form'
    await this.page.waitForSelector(formSelector)
    // ? DOM ELEMENTS
    const form = await this.page.$(formSelector)
    const inputUsername = await form.$('input#username')
    const inputPassword = await form.$('input[name="password"]')
    const buttonSubmit = await form.$('button#login_button')

    // ? INPUT DATA
    // username
    await inputUsername.click()
    await inputUsername.press('Backspace')
    await inputUsername.type(this.username)
    await this.sleep(2)
    // password
    await inputPassword.click()
    await inputPassword.press('Backspace')
    await inputPassword.type(this.password)
    await this.sleep(2)
    // submit
    await this.sleep(10)
    await buttonSubmit.click()
  }

  async parse() {
    // ? OPEN HOME PAGE
    await this.page.goto(this.urlAccountHome, { waitUntil: 'networkidle0' })
    console.log('loaded (or not)'.gray)
    const balancesSelector = 'div.balances-cards-list-wrapper'
    const transactionsSelector = 'div.widget-template.transactions-widget'
    const detailsSelector = 'div.myaccount-layout__right-pane > div.user-details'
    await this.page.waitForSelector(balancesSelector)
    await this.page.waitForSelector(transactionsSelector)
    await this.page.waitForSelector(detailsSelector)
    console.log('all selector are loaded'.gray)

    // user details
    const userDetails = await this.page.$(detailsSelector).eval('*', el => el.innerText)
    console.log(userDetails)
    // balances
    const balance = await this.page.$(balancesSelector).eval('*', el => el.innerText)
    console.log(balance)
    // transactions
    const transactions = await this.page.$(transactionsSelector).eval('*', el => el.innerText)
    console.log(transactions)

    await this.sleep(600)
  }

  async testing() {
    await this.connect()
    console.log(`PROCESS: connect`.cyan)
    await this.createPage()
    console.log(`PROCESS: connect -> createPage`.cyan)
    await this.open()
    console.log(`PROCESS: connect -> createPage -> open`.cyan)

    let i = 0
    while (await this.checkLoginPage()) {
      console.log(`PROCESS: connect -> createPage -> open -> login x${++i}`.cyan)
      await this.login()
      await this.sleep(10)
    }

    if (await this.checkAccountPage()) {
      console.log(`PROCESS: connect -> createPage -> open -> login x${i} -> parse`.cyan)
      await this.parse()
    }

    await this.disconnect()
    console.log(`PROCESS: connect -> createPage -> open -> login x${i} -> parse -> disconnect`.cyan)
  }

  findChromePath() {
    for (let path of this.chromePaths) {
      if (fs.existsSync(path)) {
        this.chromePath = path
        return
      }
    }

    console.log('CHROME NOT FOUND'.red)
    process.exit(1)
  }

  sleep(s) {
    return new Promise(r => setTimeout(r, s * 1_000))
  }
}

async function main() {
  try {
    const parser = new Parser()
    await parser.testing()
  } catch (e) {
    console.log(e?.message?.cyan)
  }
}

main()
