// Init dotenv config
import {config} from 'dotenv'
config()
// Import modules
import {ActivityType, Client, GatewayIntentBits, Partials} from 'discord.js'
// Import commands
import {Commands} from './Components/commands.js'
import {deployCommands} from "./Scripts/deploy-commands.js";
import {YoutubeChannelListener} from "./Listener/MessageListener.js";

export const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent], partials: [Partials.Channel]});

await deployCommands()

await client.login(process.env.TOKEN);

client.on("ready", async () => {
    client.user.setActivity("ban", {type: ActivityType.Playing})
    await Commands(client)
    await YoutubeChannelListener(client)
})
