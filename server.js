// main.js
const express = require("express");
const { chromium } = require("playwright");

const app = express();
const PORT = 8080;

app.get("/clear", async (req, res) => {
  const { ip, login, password } = req.query;
  if (!ip || !login || !password) {
    return res.send("Укажите параметры: /clear?ip=192.168.25.91&login=admin&password=1234");
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");

  function out(msg) {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    res.write(line);
    console.log(line.trim());
  }

  try {
    out("Запускаем браузер...");
    const browser = await chromium.launch({
      headless: true,
      args: ["--ignore-certificate-errors"]
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    out("Открываем страницу логина...");
    await page.goto(`https://${ip}/`, { waitUntil: "domcontentloaded" });

    out("Вводим логин и пароль...");
    await page.fill("#username", login);
    await page.fill("#password", password);

    out("Жмём кнопку входа...");
    await page.click("button.login-btn");

    out("Ждём загрузку страницы...");
    await page.waitForTimeout(5000);

    out("Переходим на peopleManage...");
    await page.goto(`https://${ip}/#/home/peopleManage`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    let count = 1;
    let attempts = 0;
    const maxAttempts = 45;

    while (true) {

      if (attempts >= maxAttempts) {
        out(`Достигнут лимит ${maxAttempts} попыток, останавливаемся.`);
        break;
      }

      try {
        out(`Ставим чекбокс пользователя #${count}...`);
        const checkbox = await page.$('input[ng-model="oSingleCheck.bChecked"]');
        if (!checkbox) {
          out("Чекбоксы закончились");
          break;
        }
        await checkbox.click();
        await page.waitForTimeout(1000);

        out("Снимаем чекбокс...");
        await checkbox.click();
        await page.waitForTimeout(1000);

        out("Ставим чекбокс обратно...");
        await checkbox.click();
        await page.waitForTimeout(1000);

        out("Жмём кнопку Delete...");
        await page.click('span[ng-bind="oLan.delete"]');

        out("Жмём кнопку OK в диалоге...");
        await page.click("a.layui-layer-btn0", { timeout: 10000 });

        out(`Пользователь #${count} удалён`);
        count++;
        attempts = 0;
        await page.waitForTimeout(2000);

      } catch (err) {
        attempts++;
        out(`Ошибка или таймаут (попытка ${attempts}/${maxAttempts}), пробуем снова...`);
        await page.waitForTimeout(2000);
        continue;
      }
    }

    out("Завершаем работу.");
    await browser.close();
    out("Выключаем контейнер...");

    res.end("Готово\n");

    // Завершение контейнера
    process.exit(0);

  } catch (err) {
    out("Ошибка: " + err.message);
    res.end("Ошибка: " + err.message + "\n");
  }
});

app.listen(PORT, () => {
  console.log(`Сервис запущен: http://localhost:${PORT}/clear?ip=...&login=...&password=...`);
});
