// Init dotenv config
import {config} from 'dotenv'
config()
// Import modules
import {Client, GatewayIntentBits, Partials} from 'discord.js'

// Instance partagée du client Discord.
// Ce module ne fait que la construire : la connexion (login) reste dans index.js,
// pour qu'importer le client depuis un handler ne démarre pas le bot.
export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.User]
});
