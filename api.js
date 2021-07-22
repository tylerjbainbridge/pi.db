"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var discord_js_1 = __importDefault(require("discord.js"));
var lodash_1 = __importDefault(require("lodash"));
require('dotenv').config();
var recs_json_1 = require("./recs.json");
var client = new discord_js_1["default"].Client();
client.on('ready', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log('ready!');
        return [2 /*return*/];
    });
}); });
client.on('message', function (msg) {
    var _a, _b, _c;
    if (msg.content === 'pi rec') {
        var rec = lodash_1["default"].sample(recs_json_1.recs);
        var embed = new discord_js_1["default"].MessageEmbed()
            .setTitle([rec === null || rec === void 0 ? void 0 : rec.emoji, rec === null || rec === void 0 ? void 0 : rec.title].filter(Boolean).join(' '))
            // .setAuthor("Perfectly Imperfect", "https://cdn.substack.com/image/fetch/w_1360,c_limit,f_auto,q_auto:best,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2Fecbe78f0-ea9f-4221-8db1-6d10269a5c80_1000x1019.png")
            .setDescription(rec === null || rec === void 0 ? void 0 : rec.content)
            /*
             * Takes a Date object, defaults to current date.
             */
            .setTimestamp(new Date(rec === null || rec === void 0 ? void 0 : rec.feature.date))
            .addFields({ name: "Rec'd by", value: (_a = rec === null || rec === void 0 ? void 0 : rec.guest) === null || _a === void 0 ? void 0 : _a.name, inline: true })
            .addFields({ name: "Feature URL", value: (_b = rec === null || rec === void 0 ? void 0 : rec.feature) === null || _b === void 0 ? void 0 : _b.url, inline: true })
            .setURL((_c = rec === null || rec === void 0 ? void 0 : rec.feature) === null || _c === void 0 ? void 0 : _c.url);
        if ((rec === null || rec === void 0 ? void 0 : rec.url) != null) {
            embed.setURL(rec === null || rec === void 0 ? void 0 : rec.url);
        }
        if (rec != null) {
            msg.reply(embed);
        }
    }
});
client.on('error', function (e) {
    console.log('something went wrong');
    console.log(e);
});
client.login(process.env.BOT_TOKEN);
