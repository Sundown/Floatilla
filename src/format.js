/** @format */
import chalk from "chalk";
import moment from "moment";
import boxen from "boxen";

export const fmtdate = (date) => {
    return chalk.gray(moment(date).format("MMM D, HH:mm"));
};

export const fmtname = (user) => {
    return `${chalk.bold(chalk.underline(user.name))} ${chalk.reset(
        `@${chalk.italic(user.username)}`
    )}`;
};

export const fmtname_inner = (user) => {
    return `${chalk.bold(chalk.underline(user.name))} @${chalk.italic(
        user.username
    )}`;
};

export const fmtdata = async (client, timeline, post) => {
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

export default function Format(post) {
    return boxen(
        `${fmtname(post.author)} - ${fmtdate(post.time)} \n${post.content}`,
        { borderStyle: "round", borderColor: "gray", padding: 0.5, width: 62 }
    );
}
