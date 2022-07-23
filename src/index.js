/** @format */

import Twitter from "twitter-api-v2";
import chalk from "chalk";
import moment from "moment";
import boxen from "boxen";
import dotenv from "dotenv";
import toml from "toml";
import fs from "fs";
import os from "os";

dotenv.config();

let TwitterApi = Twitter.TwitterApi;
const client = new TwitterApi(process.env.TOKEN);

const fmtdate = (date) => {
    return chalk.gray(moment(date).format("MMM D, HH:mm"));
};
const fmtname = (user) => {
    return `${chalk.bold(chalk.underline(user.name))} ${chalk.reset(
        `@${chalk.italic(user.username)}`
    )}`;
};

const fmtname_inner = (user) => {
    return `${chalk.bold(chalk.underline(user.name))} @${chalk.italic(
        user.username
    )}`;
};

const fmtdata = async (timeline, post) => {
    let text = "";
    const kind = post.referenced_tweets
        ? chalk.grey(
              chalk.italic(
                  (
                      post.referenced_tweets[0].type.charAt(0).toUpperCase() +
                      post.referenced_tweets[0].type.substring(1).toLowerCase()
                  ).replaceAll("_", " ")
              )
          )
        : "";
    const reply = await timeline.includes.repliedTo(post);
    if (reply) {
        text +=
            boxen(
                `${fmtname_inner(
                    await (
                        await client.v2.user(reply.author_id)
                    ).data
                )} - ${fmtdate(post.time)}\n${reply.text}`,
                {
                    title: kind,
                    borderStyle: "round",
                    borderColor: "gray",
                    padding: 0.5,
                    width: 54,
                }
            ) + "\n";
    }

    const quote = await timeline.includes.quote(post); // used lower down
    const retweet = await timeline.includes.retweet(post);
    if (retweet) {
        text += boxen(
            `${fmtname_inner(
                await (
                    await client.v2.user(retweet.author_id)
                ).data
            )} - ${fmtdate(post.time)}\n${retweet.text} `,
            {
                title: kind,
                borderStyle: "round",
                borderColor: "gray",
                padding: 0.5,
                width: 54,
            }
        );
    } else {
        text += post.text ?? "";
        if (quote) {
            text +=
                "\n" +
                boxen(
                    `${fmtname_inner(
                        await (
                            await client.v2.user(quote.author_id)
                        ).data
                    )} - ${fmtdate(quote.time)} \n${quote.text} `,
                    {
                        title: kind,
                        borderStyle: "round",
                        borderColor: "gray",
                        padding: 0.5,
                        width: 54,
                    }
                );
        }
        const medias = await timeline.includes.medias(post);
        if (medias.length) {
            text +=
                chalk.gray("\nMedia:\n") +
                medias
                    .map((m) => `${chalk.italic(chalk.gray(m.url.trim()))} `)
                    .join("\n");
        }
    }
    return text;
};

const fmtpost = (post) => {
    return boxen(
        `${fmtname(post.author)} - ${fmtdate(post.time)} \n${post.content}`,
        { borderStyle: "round", borderColor: "gray", padding: 0.5, width: 62 }
    );
};

const run = async (users) => {
    let array = [];
    for (let name of users) {
        const user = (await client.v2.userByUsername(name)).data;
        const timeline = await client.v2.userTimeline(user.id, {
            expansions: [
                "attachments.media_keys",
                "referenced_tweets.id",
                "referenced_tweets.id.author_id",
            ],
            "media.fields": ["url"],
            "tweet.fields": [
                "created_at",
                "in_reply_to_user_id",
                "referenced_tweets",
            ],
        });

        let res = [];
        let n = 0;
        for await (const post of timeline) {
            if (n >= 10) break;
            n++;

            res.push({
                time: post.created_at,
                author: user,
                content: await fmtdata(timeline, post),
            });
        }

        array = array.concat(res);
    }

    return array;
};

fs.readFile(os.homedir() + "/.floatilla.toml", "utf8", async (err, data) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    const config = toml.parse(data);
    console.log(
        (await run(config.accounts))
            .sort((a, b) => a.time <= b.time)
            .reverse()
            .map((p) => fmtpost(p))
            .join("\n")
    );
});
