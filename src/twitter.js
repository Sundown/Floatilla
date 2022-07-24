/** @format */
import { fmtdata } from "./format.js";
export default async function Timeline(client, users) {
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
                content: await fmtdata(client, timeline, post),
            });
        }

        array = array.concat(res);
    }

    return array;
}
