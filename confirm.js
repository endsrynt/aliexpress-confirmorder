const puppeteer = require('puppeteer');
const chalk = require('chalk');
const moment = require('moment');
const delay = require('delay');
const readline = require("readline-sync");
const fs = require('fs-extra');
var random = require('random-name')
var randomize = require('randomatic');
var Fakerator = require("fakerator");
const { finished } = require('stream');

(async () => {

    //input token
    var linklogin = readline.question(chalk.yellow('[?] List account (ex: link): '))

    console.log('\n');
    const read = fs.readFileSync(linklogin, 'UTF-8');
    const list = read.split(/\r?\n/);
    for (var i = 0; i < list.length; i++) {
    var token = list[i];

    console.log(chalk.yellow(`[${(moment().format('HH:mm:ss'))}] Account => ${i}`))       
    console.log(chalk.yellow(`[${(moment().format('HH:mm:ss'))}] Token => ${token}`))

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        ignoreHTTPSErrors: true
    });
    const page = await browser.newPage();

    const filecomment = fs.readFileSync(`./comment.txt`, 'utf-8');
    const splitFilecomment = filecomment.split('\r\n');
    var comment = splitFilecomment[Math.floor(Math.random()*splitFilecomment.length)];


    await page.setUserAgent(`Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Mobile Safari/537.36`);
    console.log(chalk.yellow(`[${(moment().format('HH:mm:ss'))}] Wait for login`))

    //login token
    await page.goto(`${token}`,{ waitUntil: 'networkidle2', timeout: 60000 });
    console.log(chalk.green(`[${(moment().format('HH:mm:ss'))}] Login success`))

    //cek order
    await page.goto("https://trade.aliexpress.com/orderList.htm",{ waitUntil: 'networkidle2', timeout: 60000 });
    const orderid = await page.evaluate(() => {
        return document.querySelector('#buyer-ordertable > tbody:nth-child(3) > tr > td:nth-child(2) > p > span:nth-child(2)').innerText
    })

    const orderstatus = await page.evaluate(() => {
        return document.querySelector('#buyer-ordertable > tbody:nth-child(3) > tr:nth-child(2) > td:nth-child(3) > span').innerText
    })
    console.log(chalk.green(`[${(moment().format('HH:mm:ss'))}] OrderID : ${orderid} | ${orderstatus}`))  


    //confirm
    if(orderstatus == "Awaiting delivery"){
        console.log(chalk.green(`[${(moment().format('HH:mm:ss'))}] Try To Confirm`))

        await page.waitForSelector("#buyer-ordertable > tbody:nth-child(3) > tr:nth-child(2) > td:nth-child(4) > button:nth-child(2)",{visible:true,timeout:60000})
        await page.click("#buyer-ordertable > tbody:nth-child(3) > tr:nth-child(2) > td:nth-child(4) > button:nth-child(2)")

        await page.waitForSelector("#confirm-receiving > tbody > tr > td:nth-child(2) > input")
        await page.click("#confirm-receiving > tbody > tr > td:nth-child(2) > input")

        await delay(800)
        await page.waitForSelector("#button-confirmOrderReceived",{visible:true,timeout:60000})
        await page.click("#button-confirmOrderReceived")

        await delay(800)
        await page.waitForSelector("#confirm_cpf",{visible:true,timeout:60000})
        await page.click("#confirm_cpf")

        await delay(2500)
        await page.waitForSelector("#j-leave-feedback-container > div > div:nth-child(2) > div > div:nth-child(2) > div:nth-child(3) >div  > span:nth-child(5)",{visible:true,timeout:60000})
        await page.click("#j-leave-feedback-container > div > div:nth-child(2) > div > div:nth-child(2) > div:nth-child(3) >div  > span:nth-child(5)")
        await delay(500)

        await page.waitForSelector("#j-leave-feedback-container > div > div:nth-child(4) > div:nth-child(2) > div > div > span:nth-child(5)",{visible:true,timeout:60000})
        await page.click("#j-leave-feedback-container > div > div:nth-child(4) > div:nth-child(2) > div > div > span:nth-child(5)")
        await delay(500)
        await page.waitForSelector("#j-leave-feedback-container > div > div:nth-child(4) > div:nth-child(3) > div > div > span:nth-child(5)",{visible:true,timeout:60000})
        await page.click("#j-leave-feedback-container > div > div:nth-child(4) > div:nth-child(3) > div > div > span:nth-child(5)")
        await delay(500)

        await page.waitForSelector("#j-leave-feedback-container > div > div:nth-child(5) > div > input",{visible:true,timeout:60000})
        await page.click("#j-leave-feedback-container > div > div:nth-child(5) > div > input")
        await delay(500)

        //submit feedback
        await page.waitForSelector("#j-leave-feedback-container > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > textarea",{visible:true,timeout:60000})
        await page.type("#j-leave-feedback-container > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > textarea",comment)
   
        console.log(chalk.green(`[${(moment().format('HH:mm:ss'))}] Your feedback has been submitted.`))

        await delay(1000)

        await page.waitForSelector("#buyerLeavefb-submit-btn",{visible:true,timeout:60000})
        await page.click("#buyerLeavefb-submit-btn")

        console.log(chalk.green(`[${(moment().format('HH:mm:ss'))}] Confirm Success`))

            // seve file
        await fs.appendFile('confirm.txt', `${token};'${orderid};CONFIRMED`+'\r\n', err => {
        if (err) throw err;
        })
        await browser.close()
    
        var files = fs.readFileSync(linklogin, 'utf-8');
        var lines = files.split('\n')
        lines.splice(0,1)
        await fs.writeFileSync(linklogin, lines.join('\n'))
    }else if(orderstatus == "Closed"){
        console.log(chalk.red(`[${(moment().format('HH:mm:ss'))}] ${orderid} CLOSED`))  
        //save file
        await fs.appendFile('confirm.txt', `${token};'${orderid};CLOSED`+'\r\n', err => {
            if (err) throw err;
        })
        await browser.close()

        var files = fs.readFileSync(linklogin, 'utf-8');
        var lines = files.split('\n')
        lines.splice(0,1)
        await fs.writeFileSync(linklogin, lines.join('\n'))
        continue;
    }else if(orderstatus == "Finished"){
        console.log(chalk.red(`[${(moment().format('HH:mm:ss'))}] ${orderid} CONFIRMED BEFORE`))  
        //save file
        await fs.appendFile('confirm.txt', `${token};'${orderid};CONFIRMED BEFORE`+'\r\n', err => {
            if (err) throw err;
        })
        await browser.close()

        var files = fs.readFileSync(linklogin, 'utf-8');
        var lines = files.split('\n')
        lines.splice(0,1)
        await fs.writeFileSync(linklogin, lines.join('\n'))
        continue;
    }else if(orderstatus == "Awaiting Payment"){
        console.log(chalk.red(`[${(moment().format('HH:mm:ss'))}] ${orderid} BELOM BAYAR`))  
        //save file
        await fs.appendFile('belombayar.txt', `${token};'${orderid};BELOM BAYAR`+'\r\n', err => {
            if (err) throw err;
        })
        await browser.close()

        var files = fs.readFileSync(linklogin, 'utf-8');
        var lines = files.split('\n')
        lines.splice(0,1)
        await fs.writeFileSync(linklogin, lines.join('\n'))
        continue;
    }

        
  
    }
})();