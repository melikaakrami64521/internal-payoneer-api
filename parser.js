require('colors')
const pup = require('puppeteer')

class Parser {
  constructor(config) {
    this.browser = null
    this.page = null

    this.config = config || {}
    this.username = null
    this.password = null
  }

  async connect() {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    this.browser = await pup.launch({
      executablePath: chromePath,
      args: ['--start-maximized', '--disable-blink-features=AutomationControlled', '--disable-infobars'],
      headless: false,
      userDataDir: './.cache',
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
    // emulate mobile device
    // const device = pup.KnownDevices['iPhone XR']
    // await this.page.emulate(device)
  }

  async open(url) {
    url = url ?? 'https://login.payoneer.com/'
    console.log(url)
    await this.page.goto(url, { waitUntil: 'networkidle0' })
  }

  async login() {
    // ! *only for testing*

    const formSelector = '.logInForm > form'
    await this.page.waitForSelector(formSelector)
    // ? DOM ELEMENTS
    const form = await this.page.$(formSelector)
    const inputUsername = await form.$('input#username')
    const inputPassword = await form.$('input[name="password"]')
    const buttonSubmit = await form.$('button#login_button')

    // ? INPUT DATA
    // username
    await inputUsername.press('Backspace')
    await inputUsername.click()
    await inputUsername.type(this.username)
    await this.sleep(5)
    // password
    await inputPassword.press('Backspace')
    await inputPassword.click()
    await inputPassword.type(this.password)
    await this.sleep(5)
    // submit
    await this.sleep(10)
    await buttonSubmit.click()

    // TODO: check if all done
  }

  async parse() {
    this.sleep(60)
    // ? OPEN HOME PAGE
    await this.page.goto('https://myaccount.payoneer.com/ma/', { waitUntil: 'networkidle0' })
    const balancesSelector = 'div.balances-cards-list-wrapper'
    const transactionsSelector = 'div.widget-template.transactions-widget'
    const detailsSelector = 'div.myaccount-layout__right-pane > div.user-details'
    await this.page.waitForSelector(balancesSelector)
    await this.page.waitForSelector(transactionsSelector)
    await this.page.waitForSelector(detailsSelector)

    // user details
    const userDetails = await detailsSelector.eval('*', el => el.innerText)
    console.log(userDetails)
    // balances
    const balance = await balancesSelector.eval('*', el => el.innerText)
    console.log(balance)
    // transactions
    const transactions = await transactionsSelector.eval('*', el => el.innerText)
    console.log(transactions)

    await this.sleep(600)
  }

  sleep(s) {
    return new Promise(r => setTimeout(r, s * 1_000))
  }
}

async function main() {
  try {
    const parser = new Parser()
    await parser.connect()
    await parser.createPage()
    await parser.open()
    await parser.login()
    await parser.parse()
    await parser.disconnect()
  } catch (e) {
    console.log(e?.message?.cyan)
  }
}

main()
