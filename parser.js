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
      //   userDataDir: './.pup',
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
    const balancesSelector = 'div.balances-cards-list'
    const transactionsSelector = 'div.transactions-content'
    const detailsSelector = 'div.myaccount-layout__right-pane > div.user-details'
    await this.page.waitForSelector(balancesSelector)
    await this.page.waitForSelector(transactionsSelector)
    await this.page.waitForSelector(detailsSelector)
    console.log('all selector are loaded'.gray)

    await this.page.screenshot({ path: 'fullpage.png', fullPage: true })
    // user details
    const userDetailsEl = await this.page.$(detailsSelector)
    await userDetailsEl.screenshot({ path: 'userdetails.png' })
    // const userDetails = await (await userDetailsEl.getProperty('textContent')).jsonValue()
    const userDetails = await userDetailsEl.evaluate(el => ({
      name: el.querySelector('div.user-name')?.innerText || null,
      id: el.querySelector('div.customer-id')?.innerText || null,
      lastLogin: el.querySelector('div.last-login')?.innerText || null,
    }))
    // balances
    const balanceEl = await this.page.$(balancesSelector)
    await balanceEl.screenshot({ path: 'balance.png' })
    // const balance = await(await balanceEl.getProperty('textContent')).jsonValue()
    const balance = await balanceEl.$$eval('div.balance-card', cards =>
      cards
        .map(card => {
          const content =
            card.querySelector('div.balance-card__content > main.balance-card__main div.balance')?.innerText || null
          if (!content) return

          const amountCurrencyArr = content.split(' ')
          return amountCurrencyArr
        })
        .reduce((res, [amount, currency]) => ({ ...res, [currency]: amount }), {})
    )
    // transactions
    const transactionsEl = await this.page.$(transactionsSelector)
    await transactionsEl.screenshot({ path: 'transactions.png' })
    const transactions = await (await transactionsEl.getProperty('textContent')).jsonValue()

    return {
      user: userDetails,
      balances: balance,
      transactions,
    }
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
      const data = await this.parse()
      console.log(data)
    }

    await this.sleep(10)
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
