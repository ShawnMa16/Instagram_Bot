const puppeteer = require('puppeteer')
const shuffle = require('shuffle-array')

let cnf = require('../config/config.js')

let run = async function () {

    // set up Puppeteer
    const browser = await puppeteer.launch({
        headless: cnf.settings.headless,
        args: ['--no-sandbox']
    })

    const page = await browser.newPage();
    page.setViewport({
        width: 1200,
        height: 764
    })

    // load Instagram
    await page.goto('https://www.instagram.com')
    await page.waitFor(2500)
    await page.click(cnf.selectors.home_to_login_button)
    await page.waitFor(2500)

    // login - fill username and password
    await page.click(cnf.selectors.username_field)
    await page.keyboard.type(cnf.username)
    await page.click(cnf.selectors.password_field)
    await page.keyboard.type(cnf.password)

    // login - login action
    await page.click(cnf.selectors.login_button)
    await page.waitForNavigation()

    console.log('=========================== start searching ===========================')

    let hashtags = shuffle(cnf.hashtags)

    for (let i = 0; i < hashtags.length; i++) {
        // search in hashtags and random
        await page.goto('https://www.instagram.com/explore/tags/' + hashtags[i])
        console.log('========> searching hashtag: ' + hashtags[i])

        // loop for the latest 9 posts
        for (let j = 1; j < 4; j++) {
            for (let k = 1; k < 4; k++) {
                // try to select post, wait, continue if succeeded
                let br = false
                await page.click('div:nth-child(4) > div > div:nth-child(' + j + ') > div:nth-child(' + k + ') > a').catch(() => {
                    br = true
                })
                await page.waitFor(2250 + Math.floor(Math.random() * 250))
                if (br) continue

                // get the post info
                let notLikeYet = await page.$(cnf.selectors.post_heart_grey)

                let username = await page.evaluate(x => {
                    let element = document.querySelector(x)
                    return Promise.resolve(element ? element.innerHTML : '')
                }, cnf.selectors.post_username)

                let followStatus = await page.evaluate(x => {
                    let element = document.querySelector(x)
                    return Promise.resolve(element ? element.innerHTML : '')
                }, cnf.selectors.post_follow_link)

                console.log('----> Evaluate post from ' + username)

                let numOfLikes = await page.evaluate(x => {
                    let element = document.querySelector(x)
                    return Promise.resolve(element ? element.innerHTML : 'no likes yet')
                }, cnf.selectors.number_of_likes)

                if (isNaN(numOfLikes)) {
                    // Close post
                    console.log('---> Exit page')
                    await page.click(cnf.selectors.post_close_button).catch(() => console.log(':::> Error closing post'))
                    continue
                }

                numOfLikes = parseInt(numOfLikes)
                console.log('--> Number of likes: ' + numOfLikes)

                // decide to like the post
                if (notLikeYet != null &&
                    numOfLikes > 30) {
                    await page.click(cnf.selectors.post_like_button)
                    console.log('-> like for ' + username)
                    await page.waitFor(10000 + Math.floor(Math.random() * 5000))
                }

                // Close post
                await page.click(cnf.selectors.post_close_button).catch(() => console.log(':::> Error closing post'))
            }
        }
    }

    // cloase browser
    console.log('=========================== End of searching ===========================')
    browser.close()
}

module.exports = run