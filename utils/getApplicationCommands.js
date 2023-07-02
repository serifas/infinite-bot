module.exports = async (client, GuildId) => {
    let applicationCommands;

    if(GuildId) {
        const guild = await client.guilds.fetch(GuildId);
        applicationCommands = guild.commands;
    } else {
        applicationCommands = await client.application.commands;
    }


    await applicationCommands.fetch();
    return applicationCommands;
}

