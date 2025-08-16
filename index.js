// ================================================================= //
//           ✨ بوت ماين كرافت باللهجة العراقية - نسخة معدلة ✨         //
//        كود مبسط ومعدل حسب الطلب مع واجهة اشتراك احترافية        //
// ================================================================= //

const TelegramBot = require("node-telegram-bot-api");
const bedrock = require("bedrock-protocol");
const fs = require("fs");
const path = require("path");

// ------------------- ⚙️ 1. الإعدادات الأساسية ------------------- //
const config = {
    TOKEN: "8240639944:AAEhy5Ml904X9kQZOdYr-XpSnLE4ZhQcIHY", //  توكن البوت مالتك
    ADMIN_ID: 7628022838, // الأيدي مالتك (استبدله بمعرفك الشخصي)
    DEVELOPER_USERNAME: "@S3S2S9", // يوزر الدعم الفني
    REQUIRED_CHANNELS: ["@Jzsoa", "@S2S5I", "@BOTAFK1"], // قنواتك (استبدلها بقنواتك)
    MAIN_PHOTO_URL: "https://t.me/BOTAFK1/71", // رابط الصورة الرئيسية
    MAX_SAVED_SERVERS: 5,
    CONNECT_TIMEOUT_MS: 30000,
    RECONNECT_INTERVAL_MS: 10000,
    MAX_RECONNECT_ATTEMPTS: 5, // عدد محاولات إعادة الاتصال القصوى
};

const bot = new TelegramBot(config.TOKEN, { polling: true });

// ------------------- 💾 2. إدارة البيانات المبسطة ------------------- //
const dataDir = path.join(__dirname, "bot_data_iraqi");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const state = {
    usersFile: path.join(dataDir, "users.json"),
    activeBots: {},
    userSessions: {},
    customButtons: [],

    load() {
        try {
            if (fs.existsSync(this.usersFile)) {
                this.userSessions = JSON.parse(fs.readFileSync(this.usersFile, "utf8"));
            }
            const buttonsFile = path.join(dataDir, "buttons.json");
            if (fs.existsSync(buttonsFile)) {
                this.customButtons = JSON.parse(fs.readFileSync(buttonsFile, "utf8"));
            }
        } catch (e) { console.error("فشل تحميل البيانات:", e); this.userSessions = {}; this.customButtons = []; }
    },

    save() {
        try {
            fs.writeFileSync(this.usersFile, JSON.stringify(this.userSessions, null, 2));
            const buttonsFile = path.join(dataDir, "buttons.json");
            fs.writeFileSync(buttonsFile, JSON.stringify(this.customButtons, null, 2));
        } catch (e) { console.error("فشل حفظ البيانات:", e); }
    },

    initUser(chatId) {
        if (!this.userSessions[chatId]) {
            this.userSessions[chatId] = { servers: [], awaiting: null };
            this.save();
        }
    }
};

state.load();

// ------------------- 🛠️ 3. الوظائف المساعدة الأساسية ------------------- //
const services = {
    async checkSubscription(chatId) {
        const statuses = {};
        let allSubscribed = true;
        for (const channel of config.REQUIRED_CHANNELS) {
            try {
                const member = await bot.getChatMember(channel, chatId);
                if (["member", "administrator", "creator"].includes(member.status)) {
                    statuses[channel] = true;
                } else {
                    statuses[channel] = false;
                    allSubscribed = false;
                }
            } catch (e) {
                statuses[channel] = false;
                allSubscribed = false;
            }
        }
        return { allSubscribed, statuses };
    },

    cleanupBot(chatId) {
        const botInstance = state.activeBots[chatId];
        if (botInstance) {
            if (botInstance.reconnectTimeout) clearTimeout(botInstance.reconnectTimeout);
            if (botInstance.client) {
                botInstance.client.removeAllListeners();
                if (botInstance.client.status !== 'disconnected') botInstance.client.disconnect();
            }
            delete state.activeBots[chatId];
        }
    },

    getUptime(startTime) {
        const diff = Date.now() - startTime;
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        let uptimeString = "";
        if (days > 0) uptimeString += `${days} يوم, `;
        if (hours > 0) uptimeString += `${hours} ساعة, `;
        uptimeString += `${minutes} دقيقة`;
        return uptimeString;
    },

    deleteServer(chatId, host, port) {
        const user = state.userSessions[chatId];
        if (user) {
            user.servers = user.servers.filter(s => s.host !== host || s.port !== port);
            state.save();
        }
    },

    saveServer(chatId, host, port) {
        const user = state.userSessions[chatId];
        if (user) {
            user.servers = user.servers.filter(s => s.host !== host || s.port !== port);
            user.servers.unshift({ host, port });
            user.servers = user.servers.slice(0, config.MAX_SAVED_SERVERS);
            state.save();
        }
    },
};



// ------------------- 🎨 4. واجهة المستخدم باللهجة العراقية ------------------- //
const ui = {
    async send(chatId, menuFunction, messageId = null, extraData = {}) {
        try {
            const { text, keyboard } = await menuFunction(chatId, extraData);
            const options = { caption: text, parse_mode: "Markdown", reply_markup: { inline_keyboard: keyboard } };

            if (messageId) {
                try {
                    await bot.editMessageCaption(text, { chat_id: chatId, message_id: messageId, ...options });
                } catch (editError) {
                    if (!editError.message?.includes("message is not modified")) {
                        await bot.deleteMessage(chatId, messageId).catch(() => {});
                        await bot.sendPhoto(chatId, config.MAIN_PHOTO_URL, options);
                    }
                }
            } else {
                await bot.sendPhoto(chatId, config.MAIN_PHOTO_URL, options);
            }
        } catch (e) { console.error("فشل إرسال الواجهة:", e.message); }
    },

    mainMenu(chatId) {
        const botInstance = state.activeBots[chatId];
        let text = `سلام عليكم انا  .\n\n` +
                   `- بوت بلاير يخلي سيرفرك مفتوح 24/7 ساعة \n` +
                   `- إذا عندك مشكلة بالبوت تكدر تراسلني الدعم الفني  ${config.DEVELOPER_USERNAME}\n\n`;
        const keyboard = [];
        
        if (botInstance) {
            text += `البوت يعمل ومتصل\n` +
                    `السيرفر: \`${botInstance.host}:${botInstance.port}\`\n` +
                    `مدة التشغيل: ${services.getUptime(botInstance.startTime)}\n`;
            keyboard.push([{ text: "- إيقاف البوت -", callback_data: "stop_bot" }]);
        } else {
            text += `البوت غير متصل حالياً\n` +
                    `اضغط على زر التشغيل للاتصال بسيرفرك والبقاء فيه 24 ساعة.\n`;
            keyboard.push([{ text: "- تشغيل البوت -", callback_data: "start_bot" }]);
        }
        
        keyboard.push(
            [{ text: "- إضافة سيرفر -", callback_data: "add_server_flow" }, { text: "- حذف سيرفر -", callback_data: "delete_server" }],
            [{ text: "- مشاكل البوت -", callback_data: "help" }, { text: "- الدعم الفني -", callback_data: "support" }],
            [{ text: "- سيرفراتي -", callback_data: "my_servers" }]
        );

        // إضافة الأزرار المخصصة
        state.customButtons.forEach(btn => {
            keyboard.push([{ text: btn.text, callback_data: btn.callback_data }]);
        });

        if (chatId == config.ADMIN_ID) {
            keyboard.push([{ text: "- لوحة المدير -", callback_data: "admin_panel" }]);
        }
        return { text, keyboard };
    },

    async subscriptionMenu(chatId, { statuses }) {
        let text = "للتشغيل، يرجى الاشتراك في القنوات التالية \n\nثم اضغط على زر /start";
        const keyboard = [];
        config.REQUIRED_CHANNELS.forEach((channel, index) => {
            const statusIcon = statuses[channel] ? '✅' : '❌';
            keyboard.push([{ text: `${index + 1} - ${channel} - ${statusIcon}`, url: `https://t.me/${channel.substring(1)}` }]);
        });
        return { text, keyboard };
    },

    serversMenu(chatId) {
        const user = state.userSessions[chatId];
        let text = "سيرفراتك المحفوظة\n\nاختر سيرفرًا للاتصال به:";
        const keyboard = [];

        if (!user || user.servers.length === 0) {
            text = "لا توجد لديك سيرفرات محفوظة.";
        } else {
            user.servers.forEach(s => {
                keyboard.push([{ text: `- ${s.host}:${s.port} -`, callback_data: `connect_${s.host}:${s.port}` }]);
            });
        }
        keyboard.push([{ text: "- رجوع -", callback_data: "main_menu" }]);
        return { text, keyboard };
    },

    helpMenu() {
        let text = `حل المشاكل الشائعة\n\n` +
                   `1. البوت لا يستطيع الاتصال:\n` +
                   `- تأكد من صحة عنوان IP والمنفذ.\n` +
                   `- تحقق مما إذا كان الخادم يعمل.\n\n` +
                   `2. البوت ينقطع اتصاله بشكل متكرر:\n` +
                   `- سيعاود الاتصال تلقائيًا، لا تقلق.\n` +
                   `- قد يكون الاتصال بالإنترنت ضعيفًا لديك أو أن الخادم يواجه مشكلة.\n\n` +
                   `إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني.`;
        const keyboard = [[{ text: "- رجوع -", callback_data: "main_menu" }]];
        return { text, keyboard };
    },

    supportMenu() {
        let text = `الدعم الفني\n\n` +
                   `إذا كان لديك أي مشكلة أو استفسار، يمكنك التواصل مع المطور مباشرة عبر اسم المستخدم الخاص به:\n\n` +
                   `المطور: ${config.DEVELOPER_USERNAME}`;
        const keyboard = [
            [{ text: "- تواصل مع المطور -", url: `https://t.me/${config.DEVELOPER_USERNAME.substring(1)}` }],
            [{ text: "- رجوع -", callback_data: "main_menu" }]
        ];
        return { text, keyboard };
    },

    adminPanelMenu() {
        const activeBots = state.activeBots;
        let text = `لوحة الإدارة\n\n` +
                   `الخوادم النشطة حالياً (${Object.keys(activeBots).length}):\n\n`;
        
        if (Object.keys(activeBots).length === 0) {
            text += "لا يوجد أي خادم نشط حالياً.";
        } else {
            Object.entries(activeBots).forEach(([chatId, botInstance]) => {
                        text += `المستخدم: \`${chatId}\`\n` +
                         `الخادم: \`${botInstance.host}:${botInstance.port}\`\n` +
                        `مدة التشغيل: ${services.getUptime(botInstance.startTime)}\n` +
                        `--------------------\n`;
            });
        }
        const keyboard = [
            [{ text: "- إضافة زر -", callback_data: "admin_add_button" }, { text: "- مسح زر -", callback_data: "admin_delete_button" }],
            [{ text: "- إذاعة -", callback_data: "admin_broadcast" }],
            [{ text: "- رجوع -", callback_data: "main_menu" }]
        ];
        return { text, keyboard };
    }
};



// ------------------- 🔌 5. منطق الاتصال وإعادة الاتصال ------------------- //
function connectToServer(chatId, host, port, reconnectAttempts = 0) {
    services.cleanupBot(chatId);
    bot.sendMessage(chatId, `جاري الاتصال بـ \`${host}:${port}\`... يرجى الانتظار.`, { parse_mode: "Markdown" });

    const client = bedrock.createClient({
        host: host, port: parseInt(port),
        username: `xboxplay_${Math.floor(Math.random() * 1000)}`,
        offline: true, connectTimeout: config.CONNECT_TIMEOUT_MS,
    });
    const botInstance = { client, host, port, startTime: null, isManualDisconnect: false, reconnectAttempts: reconnectAttempts };
    state.activeBots[chatId] = botInstance;

    client.on("spawn", () => {
        botInstance.startTime = Date.now();
        bot.sendMessage(chatId, `اتصلت بنجاح\nالبوت راح يبقى شغال 24 ساعة.`);
        services.saveServer(chatId, host, port);
        ui.send(chatId, ui.mainMenu);
    });

    client.on("disconnect", ({ message }) => {
        if (botInstance.isManualDisconnect) return;
        botInstance.reconnectAttempts++;
        if (botInstance.reconnectAttempts >= config.MAX_RECONNECT_ATTEMPTS) {
            bot.sendMessage(chatId, `فشلت محاولات إعادة الاتصال (${config.MAX_RECONNECT_ATTEMPTS} مرات). البوت توقف عن المحاولة.`);
            services.cleanupBot(chatId);
            ui.send(chatId, ui.mainMenu);
            return;
        }
        bot.sendMessage(chatId, `تم فصل بوت ، راح أحاول اشغله مره ثانيه (محاولة ${botInstance.reconnectAttempts} من ${config.MAX_RECONNECT_ATTEMPTS})`);
        botInstance.reconnectTimeout = setTimeout(() => connectToServer(chatId, host, port, botInstance.reconnectAttempts), config.RECONNECT_INTERVAL_MS);
    });

    client.on("error", (err) => {
        if (botInstance.isManualDisconnect) return;
        botInstance.reconnectAttempts++;
        if (botInstance.reconnectAttempts >= config.MAX_RECONNECT_ATTEMPTS) {
            bot.sendMessage(chatId, `صار خطأ متكرر: \`${err.message}\`. فشلت محاولات إعادة الاتصال (${config.MAX_RECONNECT_ATTEMPTS} مرات). البوت توقف عن المحاولة.`);
            services.cleanupBot(chatId);
            ui.send(chatId, ui.mainMenu);
            return;
        }
        bot.sendMessage(chatId, `صار خطأ: \`${err.message}\`. راح احاول اتصل مره لخ... (محاولة ${botInstance.reconnectAttempts} من ${config.MAX_RECONNECT_ATTEMPTS})`, { parse_mode: "Markdown" });
        botInstance.reconnectTimeout = setTimeout(() => connectToServer(chatId, host, port, botInstance.reconnectAttempts), config.RECONNECT_INTERVAL_MS);
    });
}




// ------------------- 📨 6. معالجات البوت (الرسائل والأزرار) ------------------- //
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || text.startsWith("/")) return;

    const user = state.userSessions[chatId];
    if (!user || !user.awaiting) return;

    if (user.awaiting === "server_input") {
        const serverMatch = text.match(/^(.+):(\d+)$/);
        if (!serverMatch) {
            await bot.sendMessage(chatId, "التنسيق غلط\nدز العنوان هيج:\n`IP:PORT`", { parse_mode: "Markdown" });
            return;
        }
        const [, host, port] = serverMatch;
        user.awaiting = null;
        state.save();
        connectToServer(chatId, host, port, 0);
    } else if (user.awaiting === "delete_server_input") {
        const serverMatch = text.match(/^(.+):(\d+)$/);
        if (!serverMatch) {
            await bot.sendMessage(chatId, "التنسيق غلط\nدز العنوان هيج:\n`IP:PORT`", { parse_mode: "Markdown" });
            return;
        }
        const [, host, port] = serverMatch;
        services.deleteServer(chatId, host, port);
        user.awaiting = null;
        state.save();
        await bot.sendMessage(chatId, `تم حذف السيرفر \`${host}:${port}\` من قائمتك.`);
        ui.send(chatId, ui.mainMenu);
    } else if (user.awaiting === "add_button_text") {
        user.awaiting = "add_button_callback_data";
        user.temp_button_text = text;
        state.save();
        await bot.sendMessage(chatId, "أرسل الكولباك داتا للزر الجديد\nمثال: `new_button_action`", { parse_mode: "Markdown" });
    } else if (user.awaiting === "add_button_callback_data") {
        const buttonText = user.temp_button_text;
        const callbackData = text;
        state.customButtons.push({ text: buttonText, callback_data: callbackData });
        delete user.temp_button_text;
        user.awaiting = null;
        state.save();
        await bot.sendMessage(chatId, `تم إضافة الزر الجديد:\nنص الزر: ${buttonText}\nكولباك داتا: ${callbackData}`, { parse_mode: "Markdown" });
        ui.send(chatId, ui.adminPanelMenu);
    } else if (user.awaiting === "delete_button_text") {
        const buttonTextToDelete = text;
        const initialLength = state.customButtons.length;
        state.customButtons = state.customButtons.filter(btn => btn.text !== buttonTextToDelete);
        user.awaiting = null;
        state.save();
        if (state.customButtons.length < initialLength) {
            await bot.sendMessage(chatId, `تم حذف الزر: \`${buttonTextToDelete}\``, { parse_mode: "Markdown" });
        } else {
            await bot.sendMessage(chatId, `الزر \`${buttonTextToDelete}\` غير موجود.`, { parse_mode: "Markdown" });
        }
        ui.send(chatId, ui.adminPanelMenu);
    } else if (user.awaiting === "broadcast_message") {
        const broadcastMessage = text;
        user.awaiting = null;
        state.save();
        let sentCount = 0;
        for (const userId in state.userSessions) {
            try {
                await bot.sendMessage(userId, `رسالة من المدير:\n\n${broadcastMessage}`, { parse_mode: "Markdown" });
                sentCount++;
            } catch (e) {
                console.error(`فشل إرسال رسالة البث إلى ${userId}:`, e.message);
            }
        }
        await bot.sendMessage(chatId, `تم إرسال رسالة البث إلى ${sentCount} مستخدم.`, { parse_mode: "Markdown" });
        ui.send(chatId, ui.adminPanelMenu);
    }
});

bot.on("callback_query", async (q) => {
    const chatId = q.message.chat.id;
    const data = q.data;
    await bot.answerCallbackQuery(q.id);

    state.initUser(chatId);
    const user = state.userSessions[chatId];

    if (data === "main_menu") {
        ui.send(chatId, ui.mainMenu, q.message.message_id);
    } else if (data === "start_bot") {
        user.awaiting = "server_input";
        state.save();
        await bot.sendMessage(chatId, "أرسل الان عنوان السيرفر (IP:PORT) للاتصال به:\nمثال: `play.aternos.me:19132`", { parse_mode: "Markdown" });
    } else if (data === "stop_bot") {
        const botInstance = state.activeBots[chatId];
        if (botInstance) {
            botInstance.isManualDisconnect = true;
            botInstance.client.disconnect();
            services.cleanupBot(chatId);
            await bot.sendMessage(chatId, "تم إيقاف البوت بنجاح.");
        }
        ui.send(chatId, ui.mainMenu, q.message.message_id);
    } else if (data === "my_servers") {
        ui.send(chatId, ui.serversMenu, q.message.message_id);
    } else if (data.startsWith("connect_")) {
        const serverAddress = data.substring("connect_".length);
        const [host, port] = serverAddress.split(":");
        connectToServer(chatId, host, port, 0);
    } else if (data === "delete_server") {
        user.awaiting = "delete_server_input";
        state.save();
        await bot.sendMessage(chatId, "أرسل الان عنوان السيرفر (IP:PORT) الذي تريد حذفه من قائمتك:\nمثال: `play.example.com:19132`", { parse_mode: "Markdown" });
    } else if (data === "add_server_flow") {
        if (user.servers.length >= config.MAX_SAVED_SERVERS) {
            await bot.sendMessage(chatId, `لا يمكنك حفظ أكثر من ${config.MAX_SAVED_SERVERS} سيرفرات. يرجى حذف سيرفر قديم أولاً.`);
            return;
        }
        user.awaiting = "server_input";
        state.save();
        await bot.sendMessage(chatId, "أرسل عنوان السيرفر (IP:PORT) لإضافته:\nمثال: `play.example.com:19132`", { parse_mode: "Markdown" });
    } else if (data === "help") {
        ui.send(chatId, ui.helpMenu, q.message.message_id);
    } else if (data === "support") {
        ui.send(chatId, ui.supportMenu, q.message.message_id);
    } else if (data === "admin_panel") {
        if (chatId == config.ADMIN_ID) {
            ui.send(chatId, ui.adminPanelMenu, q.message.message_id);
        } else {
            await bot.sendMessage(chatId, "أنت لست المدير.");
        }
    } else if (data === "admin_add_button") {
        if (chatId == config.ADMIN_ID) {
            user.awaiting = "add_button_text";
            state.save();
            await bot.sendMessage(chatId, "أرسل نص الزر الجديد\nمثال: `زر جديد`");
        } else {
            await bot.sendMessage(chatId, "أنت لست المدير.");
        }
    } else if (data === "admin_delete_button") {
        if (chatId == config.ADMIN_ID) {
            user.awaiting = "delete_button_text";
            state.save();
            await bot.sendMessage(chatId, "أرسل نص الزر الذي تريد حذفه\nمثال: `زر جديد`");
        } else {
            await bot.sendMessage(chatId, "أنت لست المدير.");
        }
    } else if (data === "admin_broadcast") {
        if (chatId == config.ADMIN_ID) {
            user.awaiting = "broadcast_message";
            state.save();
            await bot.sendMessage(chatId, "أرسل رسالة البث التي تريد إرسالها لجميع المستخدمين.");
        } else {
            await bot.sendMessage(chatId, "أنت لست المدير.");
        }
    } else {
        // Handle custom buttons callback data
        const customButton = state.customButtons.find(btn => btn.callback_data === data);
        if (customButton) {
            await bot.sendMessage(chatId, `تم الضغط على الزر المخصص: ${customButton.text}`);
            // يمكنك إضافة منطق خاص هنا للتعامل مع كل زر مخصص
        } else {
            await bot.sendMessage(chatId, "أمر غير معروف.");
        }
    }
});

// ------------------- 🚀 7. بدء البوت ------------------- //
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    state.initUser(chatId);

    const { allSubscribed, statuses } = await services.checkSubscription(chatId);

    if (allSubscribed) {
        ui.send(chatId, ui.mainMenu);
    } else {
        ui.send(chatId, ui.subscriptionMenu, null, { statuses });
    }
});

bot.onText(/\/admin/, async (msg) => {
    const chatId = msg.chat.id;
    if (chatId == config.ADMIN_ID) {
        ui.send(chatId, ui.adminPanelMenu);
    } else {
        await bot.sendMessage(chatId, "أنت لست المدير.");
    }
});

console.log("البوت يعمل...");


