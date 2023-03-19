import {config} from 'dotenv'
// Init dotenv config
config()
// Import modules
import {ActivityType, Client, GatewayIntentBits, Partials} from 'discord.js'

export const client = new Client({intents: [GatewayIntentBits.Guilds], partials: [Partials.Channel]});
// Import commands
import {Commands} from './Components/commands.js'
import {deployCommands} from "./Scripts/deploy-commands.js";

await deployCommands()

await client.login(process.env.TOKEN);

client.on("ready", async () => {
    client.user.setActivity("ban", {type: ActivityType.Playing})
    await Commands(client)
})
