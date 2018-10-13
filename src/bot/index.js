const Telegraf = require('telegraf');
const nconf = require('nconf');

const { get, add, remove, initListen } = require('./petitions');

const { token } = nconf.get('telegram');
const bot = new Telegraf(token);

const run = async () => {
  // const hasBotCommands = (entities) => {
  //   if (!entities || !(entities instanceof Array)) {
  //     return false;
  //   }
  
  //   return entities.some(e => e.type === 'bot_command');
  // };


  // bot.help(ctx => ctx.reply(helpMsg.join('\n')));
  bot.start(async ({ reply, from: { id: resChatId } }) => {
    await get(reply);
    await add(reply, resChatId);
    const helpMsg = ['대화창에 아래 명령어를 입력하시면 됩니다.', '/get 현재 청원참여수 보기',
      '/start 청원참여수 알람받기',
      '/stop 청원참여수 알람중지'];
    reply(helpMsg.join('\n'));
  });

  bot.command('stop', async ({ reply, from: { id: resChatId } }) => {
    await remove(reply, resChatId);
  });

  bot.command('get', async ({ reply }) => {
    await get(reply);
  });

  // bot.command('setalarm', ({ reply }) => reply('/setalarm \n\n알람을 받을 단위값을 입력하세요.\n\n입력값은 100, 1000, 10000 총3가지 입니다.\n\n만약 100을 입력하면 청원참여수의 100명 단위마다 알람이 발송됩니다.\n(예 69,900명, 67,000명, 67,100명)', { reply_markup: { force_reply: true, selective: true } }));

  // bot.on('message', async (ctx) => {
  //   const { message, reply } = ctx;
  //   const resChatId = ctx.from.id;
  //   if (!hasBotCommands(message.entities)) {
  //     console.log(JSON.stringify(message, null, 2));
  //     const { reply_to_message } = message;
  //     if (reply_to_message) {
  //       const { text } = reply_to_message;

  //       if (text.startsWith('/setalarm')) {
  //         try {
  //           const value = message.text;
  //           await setAlarm(resChatId, value, reply);
  //         } catch (err) {
  //           reply(`Error Occured: ${JSON.stringify(err)}`);
  //         }
  //       }
  //     }
  //   }
  // });

  bot.catch((err) => {
    console.log('Ooops', err);
  });

  bot.startPolling();
  await initListen(bot);
};

module.exports = async () => {
  await run();
};
