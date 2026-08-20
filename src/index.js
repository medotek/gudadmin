// Init dotenv config
import {config} from 'dotenv'
config()
// Import modules
import {ActivityType} from 'discord.js'
// Import commands
import {client} from './Module/Client.js'
import {Commands} from './Components/commands.js'
import {deployCommands} from "./Scripts/deploy-commands.js";
import {YoutubeChannelListener} from "./Listener/MessageListener.js";
import {XChannelListener} from "./Listener/XChannelListener.js";
import {VuReactionListener} from "./Listener/ReactionListener.js";

if (process.env.DEPLOY_ON_START === 'true') {
    await deployCommands()
}

// Le handler doit être posé avant le login : sinon le paquet READY peut arriver
// avant l'enregistrement et aucun listener ne serait câblé.
// `once` et pas `on` : si clientReady refire après une reconnexion, rejouer ce bloc
// empilerait un second interactionCreate et chaque commande serait traitée en double.
client.once('clientReady', async () => {
    client.user.setActivity("ban", {type: ActivityType.Playing})
    await Commands(client)
    await YoutubeChannelListener(client)
    await XChannelListener()
    VuReactionListener(client)
})

await client.login(process.env.TOKEN);
