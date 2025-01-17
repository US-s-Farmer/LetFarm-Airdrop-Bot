const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const {
  getCurrentStep,
  STEP_WALLET,
  STEP_NONE,
  STEP_TELEGRAM,
  STEP_VERSE,
  isJoin,
  STEP_TWITTER,
  isUniqueTwitter,
  updateAirdrop,
  STEP_FACEBOOK,
  STEP_REFERRAL,
  getAirdropById,
  restartAirdrop,
  isUniqueFacebook,
  isUniqueTelegram,
  isUniqueWallet,
  addReferralUser,
  setIsDone,
  getIsDone,
  countBonus,
} = require('./airdroper.controller');

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.BOT_API;
const listText = require('./message');
const { convert } = require('../helper/convertDateToTimeStamp');

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

const keyboards = {
  facebook: {
    inline_keyboard: [
      [{ text: 'Facebook', url: process.env.FACEBOOK_LINK }],
      [{ text: 'Facebook post', url: process.env.FACEBOOK_POST_LINK }],
    ],
  },
  twitter: {
    inline_keyboard: [
      [{ text: "LetFarm's Twitter", url: process.env.TWITTER_LINK }],
      [{ text: "LetFarm's Twitter Post", url: process.env.POST_LINK }],
    ],
  },
  telegram: {
    inline_keyboard: [
      [{ text: "LetFarm's Telegram", url: process.env.TELEGRAM_LINK }],
    ],
  },
  verse: {
    inline_keyboard: [
      [{ text: "Verse's Twitter", url: process.env.VERSE_TWITTER }],
      [{ text: "Verse's Telegram", url: process.env.VERSE_TELEGRAM }],
    ],
  },
  restart: {
    inline_keyboard: [
      [{ text: '🔁 RESTART', callback_data: 'RESTART' }],
      [{ text: '✅ DONE', callback_data: 'DONE' }],
    ],
  },
  statistic: {
    inline_keyboard: [[{ text: '〽️ STATISTIC', callback_data: 'STATISTIC' }]],
  },
};

bot.onText(/\/start (.+)|\/start/i, async (msg, match) => {
  const id = msg.chat.id;

  if (canAirdrop() == 'PRESTART') {
    return bot.sendMessage(id, listText.PRE_START);
  } else if (canAirdrop() == 'ENDED') {
    return bot.sendMessage(id, listText.ENDED);
  }
  if (msg.from.is_bot) {
    return;
  }

  const _isJoined = await isJoin(id);
  if (_isJoined === STEP_REFERRAL) {
    return await bot.sendMessage(msg.chat.id, listText.DONE(msg.chat.id), {
      reply_markup: keyboards.statistic,
    });
  } else if (_isJoined == false) {
    if (match[1] != undefined) {
      await addReferralUser(msg.chat.id, match[1]);
    }
    await bot.sendMessage(id, listText.START(msg.chat.username));
    await bot.sendMessage(id, listText.FACEBOOK(msg.chat.username), {
      reply_markup: keyboards.facebook,
    });
  }
});

bot.onText(/\.*/, async (msg) => {
  const id = msg.chat.id;
  if (canAirdrop() === 'PRESTART') {
    return bot.sendMessage(id, listText.PRE_START);
  } else if (canAirdrop() === 'ENDED') {
    return bot.sendMessage(id, listText.ENDED);
  } else {
    const step = await getCurrentStep(id);
    await mission({ msg: msg, step: step });
  }
});

const mission = async ({ msg, step }) => {
  if (step === STEP_NONE) {
    return;
  } else if (step === STEP_FACEBOOK) {
    await facebookStep(msg);
  } else if (step === STEP_TWITTER) {
    await twitterStep(msg);
  } else if (step === STEP_TELEGRAM) {
    // const check = await checkJoinedTelegramGroup(msg.chat.id);
    // if (!check) {
    //   return bot.sendMessage(msg.chat.id, listText.teleNotJoin);
    // }
    await telegramStep(msg);
  } else if (step === STEP_VERSE) {
    await verseStep(msg);
  } else if (step === STEP_WALLET) {
    await walletStep(msg);
  }
};

const twitterStep = async (msg) => {
  if (msg.text[0] !== '@') {
    return bot.sendMessage(msg.chat.id, listText.validTwitter);
  } else if (await isUniqueTwitter(msg.text)) {
    return bot.sendMessage(
      msg.chat.id,
      '❌ Twitter is used. Please try another one'
    );
  } else {
    await bot.sendMessage(msg.chat.id, listText.TELEGRAM(msg.chat.username), {
      reply_markup: keyboards.telegram,
    });
    await updateAirdrop({ id: msg.chat.id, twitter: msg.text });
  }
};

const facebookStep = async (msg) => {
  if (msg.text == '/start') {
    return await bot.sendMessage(
      msg.chat.id,
      listText.FACEBOOK(msg.chat.username),
      {
        reply_markup: keyboards.facebook,
      }
    );
  }
  if (await isUniqueFacebook(msg.text)) {
    return bot.sendMessage(
      msg.chat.id,
      '❌ Facebook is used. Please try another one'
    );
  }
  await updateAirdrop({ id: msg.chat.id, facebook: msg.text });
  return bot.sendMessage(msg.chat.id, listText.TWITTER(msg.chat.username), {
    reply_markup: keyboards.twitter,
  });
};

const telegramStep = async (msg) => {
  if (await isUniqueTelegram(msg.text)) {
    return bot.sendMessage(
      msg.chat.id,
      '❌ Telegram user is used. Please try another one'
    );
  }
  await updateAirdrop({ id: msg.chat.id, telegram: msg.text });
  return bot.sendMessage(msg.chat.id, listText.VERSE(msg.chat.username), {
    reply_markup: keyboards.verse,
  });
};

const verseStep = async (msg) => {
  if (msg.text !== 'next') {
    return bot.sendMessage(msg.chat.id, listText.validNext);
  }
  await updateAirdrop({ id: msg.chat.id, verse: msg.text });
  return bot.sendMessage(msg.chat.id, listText.WALLET(msg.chat.username));
};

const walletStep = async (msg) => {
  if (!/^(0x){1}[0-9a-fA-F]{40}$/i.test(msg.text)) {
    return bot.sendMessage(msg.chat.id, listText.validWallet);
  } else if (await isUniqueWallet(msg.text)) {
    return bot.sendMessage(
      msg.chat.id,
      '❌ Wallet user is used. Please try another one'
    );
  } else {
    await updateAirdrop({ id: msg.chat.id, wallet: msg.text });
    const info = await getAirdropById(msg.chat.id);

    return bot.sendMessage(msg.chat.id, listText.confirmInfo(info), {
      reply_markup: keyboards.restart,
    });
  }
};

const checkJoinedTelegramGroup = async (id) => {
  const result = await bot.getChatMember(process.env.TELEGRAM_GROUP_ID, id);
  if (!result) {
    return false;
  }
  return true;
};

const canAirdrop = () => {
  const now = Date.now();
  const start = convert(process.env.BEGIN_TIME);
  const ended = convert(process.env.END_TIME);

  if (now < start) {
    return 'PRESTART';
  } else if (now > ended) {
    return 'ENDED';
  } else {
    return true;
  }
};

bot.on('callback_query', async (callbackQuery) => {
  if (callbackQuery.data == 'RESTART') {
    if (await getIsDone(callbackQuery.from.id)) {
      return bot.sendMessage(
        callbackQuery.from.id,
        '❌ You cannot restart airdrop after comfirming'
      );
    }
    await restartAirdrop(callbackQuery.from.id);
    bot.sendMessage(callbackQuery.from.id, listText.RESTART);
  } else if (callbackQuery.data == 'DONE') {
    await setIsDone(callbackQuery.from.id);
    return bot.sendMessage(
      callbackQuery.from.id,
      listText.DONE(callbackQuery.from.id),
      {
        reply_markup: keyboards.statistic,
      }
    );
  } else if (callbackQuery.data == 'STATISTIC') {
    const bonusAmount = await countBonus(callbackQuery.from.id);
    return bot.sendMessage(
      callbackQuery.from.id,
      listText.STATISTIC({
        user: callbackQuery.from.username,
        bonusAmount: bonusAmount,
      })
    );
  }
});
