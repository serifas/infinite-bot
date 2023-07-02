module.exports = {
    name: 'ping',
    description: 'Get ponged!',
    managementOnly: true,

    callback: (client, interaction) => {
        const timeTaken = Date.now() - interaction.createdTimestamp;
        interaction.reply(`You have been ponged! ${timeTaken}ms.`);  
        console.log(`Ping recieved! Ponging back!`);
    }
}

