/** @format */

import Twitter from "twitter-api-v2";
import dotenv from "dotenv";
import toml from "toml";
import fs from "fs";
import os from "os";

import Format from "./format.js";
import Timeline from "./twitter.js";

dotenv.config();

const Client = new Twitter.TwitterApi(process.env.TOKEN);

fs.readFile(os.homedir() + "/.floatilla.toml", "utf8", async (err, data) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    console.log(
        (await Timeline(Client, toml.parse(data).accounts))
            .sort((a, b) => a.time <= b.time)
            .reverse()
            .map((p) => Format(p))
            .join("\n")
    );
});
