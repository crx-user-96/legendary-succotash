"use strict";

const utils = require("../utils");
const log = require("npmlog");
const gradient = require("gradient-string");
const chalk = require("chalk");
const _ = require("../../../config.json");

module.exports = function (defaultFuncs, api, ctx) {
  return function markAsDelivered(threadID, messageID, callback) {
    let resolveFunc = () => {};
    let rejectFunc = () => {};

    const returnPromise = new Promise((resolve, reject) => {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (!callback) {
      callback = (err, friendList) => {
        if (err) {
          return rejectFunc(err);
        }
        resolveFunc(friendList);
      };
    }

    if (!threadID || !messageID) {
      return callback("Error: messageID or threadID is not defined");
    }

    const form = {};
    form["message_ids[0]"] = messageID;
    form[`thread_ids[${threadID}][0]`] = messageID;

    defaultFuncs
      .post("https://www.facebook.com/ajax/mercury/delivery_receipts.php", ctx.jar, form)
      .then(utils.saveCookies(ctx.jar))
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
      .then(resData => {
        if (resData.error) throw resData;
        return callback();
      })
      .catch(err => {
        log.error("markAsDelivered", err);
        if (utils.getType(err) === "Object" && err.error === "Not logged in.") {
          ctx.loggedIn = false;
        }
        return callback(err);
      });

    return returnPromise;
  };
};

module.exports.logs = function () {
  const asciiMappings = {
    a: { upper: ' ▄▀█', lower: '░█▀█' },
    b: { upper: '░█▄▄', lower: '░█▄█' },
    c: { upper: '░█▀▀', lower: '░█▄▄' },
    d: { upper: '░█▀▄', lower: '░█▄▀' },
    e: { upper: '░█▀▀', lower: '░██▄' },
    f: { upper: '░█▀▀', lower: '░█▀ ' },
    g: { upper: '░█▀▀', lower: '░█▄█' },
    h: { upper: '░█░█', lower: '░█▀█' },
    i: { upper: '░█', lower: '░█' },
    j: { upper: '░░░█', lower: '░█▄█' },
    k: { upper: '░█▄▀', lower: '░█░█' },
    l: { upper: '░█░░', lower: '░█▄▄' },
    m: { upper: '░█▀▄▀█', lower: '░█░▀░█' },
    n: { upper: '░█▄░█', lower: '░█░▀█' },
    o: { upper: '░█▀█', lower: '░█▄█' },
    p: { upper: '░█▀█', lower: '░█▀▀' },
    q: { upper: '░█▀█', lower: ' ▀▀█' },
    r: { upper: '░█▀█', lower: '░█▀▄' },
    s: { upper: '░█▀', lower: '░▄█' },
    t: { upper: ' ▀█▀', lower: '░░█░' },
    u: { upper: '░█░█', lower: '░█▄█' },
    v: { upper: '░█░█', lower: '░▀▄▀' },
    w: { upper: '░█░█░█', lower: '░▀▄▀▄▀' },
    x: { upper: ' ▀▄▀', lower: '░█░█' },
    y: { upper: '░█▄█', lower: '░░█░' },
    z: { upper: '░▀█', lower: '░█▄' },
    '-': { upper: ' ▄▄', lower: '░░░' },
    '+': { upper: ' ▄█▄', lower: '░░▀░' },
    '.': { upper: '░', lower: '▄' },
  };

  function generateAsciiArt(text) {
    const title = text || 'BotPack';
    const lines = ['   ', '   '];
    for (const char of title.toLowerCase()) {
      const mapping = asciiMappings[char] || { upper: '  ', lower: '  ' };
      lines[0] += mapping.upper;
      lines[1] += mapping.lower;
    }
    return lines.join('\n');
  }

  const themeName = _.DESIGN.Theme.toLowerCase() || '';
  let ch;
  let cre;

  switch (themeName) {
    case 'fiery':
      ch = gradient.fruit;
      cre = gradient.fruit;
      break;
    case 'aqua':
      ch = gradient("#2e5fff", "#466deb");
      cre = chalk.hex("#88c2f7");
      break;
    case 'hacker':
      ch = gradient('#47a127', '#0eed19', '#27f231');
      cre = chalk.hex('#4be813');
      break;
    case 'pink':
      ch = gradient("#ab68ed", "#ea3ef0", "#c93ef0");
      cre = chalk.hex("#8c00ff");
      break;
    case 'blue':
      ch = gradient("#243aff", "#4687f0", "#5800d4");
      cre = chalk.blueBright;
      break;
    case 'sunlight':
      ch = gradient("#ffae00", "#ffbf00", "#ffdd00");
      cre = chalk.hex("#f6ff00");
      break;
    case 'red':
      ch = gradient("#ff0000", "#ff0026");
      cre = chalk.hex("#ff4747");
      break;
    case 'retro':
      ch = gradient.retro;
      cre = chalk.hex("#7d02bf");
      break;
    case 'teen':
      ch = gradient.teen;
      cre = chalk.hex("#fa7f7f");
      break;
    case 'summer':
      ch = gradient.summer;
      cre = chalk.hex("#f7f565");
      break;
    case 'flower':
      ch = gradient.pastel;
      cre = chalk.hex("#6ded85");
      break;
    case 'ghost':
      ch = gradient.mind;
      cre = chalk.hex("#95d0de");
      break;
    case 'purple':
      ch = gradient("#380478", "#5800d4", "#4687f0");
      cre = chalk.hex('#7a039e');
      break;
    case 'rainbow':
      ch = gradient.rainbow;
      cre = chalk.hex('#0cb3eb');
      break;
    case 'orange':
      ch = gradient("#ff8c08", "#ffad08", "#f5bb47");
      cre = chalk.hex('#ff8400');
      break;
    default:
      ch = gradient("#243aff", "#4687f0", "#5800d4");
      cre = chalk.blueBright;
      setTimeout(() => {
        console.log(`The ${chalk.bgYellow.bold(_.DESIGN.Theme)} theme you provided does not exist!`);
      }, 1000);
  }

  setTimeout(() => {
    const title = _.DESIGN.Title || '';
    const asciiTitle = generateAsciiArt(title);
    console.log(
      ch.multiline('\n' + asciiTitle),
      '\n',
      ch(' \u2771 ') + 'CREATOR:',
      cre('MR᭄﹅ MAHABUB﹅ メꪜ'),
      '\n',
      ch(' \u2771 ') + `Admin: ${cre(_.DESIGN.Admin || 'Unknown')}\n`
    );
  }, 1000);
};
