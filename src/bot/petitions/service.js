
const cheerio = require('cheerio');
const axios = require('axios');
const schedule = require('node-schedule');
const petitions = require('../../db')();
const { numberformat } = require('../utils');

let bot = null;
let job = null;

const getCount = async () => {
  const result = await axios.get('http://www1.president.go.kr/petitions/394401?navigation=best-petitions');
  const $ = cheerio.load(result.data);
  const count = $('h2.petitionsView_count .counter').text();
  return count;
};

const getLastAlarmCount = async () => {
  const lastAlarmCount = await petitions.child('/lastAlarmCount').once('value');
  console.log(lastAlarmCount.val());
  const count = lastAlarmCount.val() || 0;
  return count;
};

const checkCount = async () => {
  console.log(new Date());

  const lastAlarmCount = await getLastAlarmCount();
  console.log(lastAlarmCount);

  const currentCount = await getCount();
  console.log(currentCount);

  const currentNum = currentCount.split(',').reduce((pre, next) => pre + next, '');

  // const alarmCount = Math.floor(currentNum / 500) * 500;
  const alarmCount = Math.floor(currentNum / 100) * 100;
  console.log(alarmCount);

  if (parseInt(lastAlarmCount, 10) < parseInt(alarmCount, 10)) {
    await petitions.update({ lastAlarmCount: alarmCount });

    const listenChatIds = await petitions.child('/listenChatIds').once('value');
    const ids = listenChatIds.val() || {};

    const msg = `<b>** ${numberformat(alarmCount)}명 돌파, 앞으로 ${numberformat(200000 - alarmCount)}명 **</b>\n\n국민연금 주식대여금지 청원 20만명 달성을 응원합니다.\n\n이 알람은 청원참여수 100명 단위마다 발송되는 메시지 입니다.\n\nhttp://www1.president.go.kr/petitions/394401?navigation=best-petitions`;

    await Promise.all(Object.keys(ids).map(async (chatId) => {
      bot.telegram.sendMessage(chatId, msg, { parse_mode: 'HTML' });
    }));
  }
};

exports.add = async (reply, chatId) => {
  const listenChatIds = await petitions.child('/listenChatIds').once('value');
  const newIds = listenChatIds.val() || {};

  if (!newIds[chatId]) {
    newIds[chatId] = {
      createTime: new Date(),
    };
  
    const updates = {
      listenChatIds: newIds,
    };
    
    await petitions.update(updates);
  }
  reply('100명 단위마다 청원참여 인원수 알람이 발송됩니다.', { parse_mode: 'HTML' });
};

exports.setAlarm = async (chatId, value, reply) => {
  const listenChatIds = await petitions.child('/listenChatIds').once('value');
  const newIds = listenChatIds.val() || {};

  if (value !== '100' && value !== '1000' && value !== '10000') {
    return reply('입력값이 잘못되었습니다.', { parse_mode: 'HTML' });
  }
  if (newIds[chatId]) {
    const data = newIds[chatId];
    data.alarm = value;
    data.updateTime = new Date();
  } else {
    return reply('not found', { parse_mode: 'HTML' });
  }

  const updates = {
    listenChatIds: newIds,
  };
  
  await petitions.update(updates);
  reply(`알람단위가 ${value}로 설정되었습니다.`, { parse_mode: 'HTML' });
};

exports.remove = async (reply, chatId) => {
  const listenChatIds = await petitions.child('/listenChatIds').once('value');
  const newIds = listenChatIds.val() || {};

  if (newIds[chatId]) {
    delete newIds[chatId];
    const updates = {
      listenChatIds: newIds,
    };
    await petitions.update(updates);
    reply('알람발송이 중지되었습니다.', { parse_mode: 'HTML' });
  } else {
    reply('not found id', { parse_mode: 'HTML' });
  }
};

exports.get = async (reply) => {
  // const lastAlarmCount = await petitions.child('/lastAlarmCount').once('value');
  // console.log(lastAlarmCount.val());


  // const msg = count.split(',').reduce((pre, next) => pre + next, '');
  const count = await getCount();
  reply(`현재 국민연금 주식대여금지 청원 참여인원은\n<b>${count}</b>명 입니다.\n\nhttp://www1.president.go.kr/petitions/394401?navigation=best-petitions`, { parse_mode: 'HTML' });
};

exports.initListen = async (myBot) => {
  console.log(new Date());
  bot = myBot;
  job = schedule.scheduleJob('*/1 * * * *', async () => {
    await checkCount();
  });
};
